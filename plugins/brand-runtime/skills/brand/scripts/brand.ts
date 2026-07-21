import { createHash } from "node:crypto";
import { access, readdir, readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";

type JsonObject = Record<string, unknown>;
type Surface = "site" | "product" | "presentation" | "document";

const args = process.argv.slice(2);
const command = args[0] ?? "status";

function option(name: string): string | undefined {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
}

async function exists(path: string): Promise<boolean> {
  try { await access(path); return true; } catch { return false; }
}

async function isDirectory(path: string): Promise<boolean> {
  try { return (await stat(path)).isDirectory(); } catch { return false; }
}

async function json(path: string): Promise<JsonObject> {
  return JSON.parse(await readFile(path, "utf8")) as JsonObject;
}

async function sha256(path: string): Promise<string> {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

function positionalBrand(): string | undefined {
  const candidate = args[1];
  return candidate && !candidate.startsWith("--") ? candidate : undefined;
}

function assertSlug(slug: string): void {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`Invalid brand slug "${slug}". Use lowercase kebab-case.`);
  }
}

async function findProjectRoot(start: string): Promise<string> {
  let current = resolve(start);
  while (true) {
    if (await isDirectory(resolve(current, "brand"))) return current;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Could not find a project root containing brand/. Use --project-root or --brand-root.");
}

async function resolveBrandsRoot(): Promise<string> {
  const explicitBrandRoot = option("brand-root");
  if (explicitBrandRoot) return resolve(process.cwd(), explicitBrandRoot);

  const explicitProjectRoot = option("project-root");
  const projectRoot = explicitProjectRoot
    ? resolve(process.cwd(), explicitProjectRoot)
    : await findProjectRoot(process.cwd());
  return resolve(projectRoot, "brand");
}

async function resolveBrand(): Promise<{ slug: string; root: string }> {
  const brandsRoot = await resolveBrandsRoot();
  const requested = option("brand") ?? positionalBrand();
  if (requested) {
    assertSlug(requested);
    return { slug: requested, root: resolve(brandsRoot, requested) };
  }

  const discovered = await readdir(brandsRoot, { withFileTypes: true });
  const entries: typeof discovered = [];
  for (const entry of discovered) {
    if (entry.isDirectory() || entry.isSymbolicLink() && await isDirectory(resolve(brandsRoot, entry.name))) {
      entries.push(entry);
    }
  }
  if (entries.length !== 1) {
    const available = entries.map((entry) => entry.name).sort();
    const detail = available.length ? ` Available: ${available.join(", ")}.` : "";
    throw new Error(`Use --brand <slug> when zero or multiple Brand Packs are installed.${detail}`);
  }
  const onlyBrand = entries[0];
  if (!onlyBrand) throw new Error("Brand Pack resolution failed after directory discovery.");
  assertSlug(onlyBrand.name);
  return { slug: onlyBrand.name, root: resolve(brandsRoot, onlyBrand.name) };
}

async function inspectPack() {
  const brand = await resolveBrand();
  const required = ["brand.source.json", "tokens.json", "brand-guidelines.md", "build-manifest.json"];
  const present = Object.fromEntries(await Promise.all(required.map(async (file) => [file, await exists(resolve(brand.root, file))])));
  return { ...brand, required, present };
}

async function validatePack() {
  const pack = await inspectPack();
  const errors: string[] = [];
  for (const file of pack.required) if (!pack.present[file]) errors.push(`Missing ${file}`);
  if (errors.length) return { ...pack, valid: false, errors };

  const source = await json(resolve(pack.root, "brand.source.json"));
  const tokens = await json(resolve(pack.root, "tokens.json"));
  const manifest = await json(resolve(pack.root, "build-manifest.json"));
  const expectedSlug = pack.slug;
  const expectedVersion = source.brandVersion;

  for (const [label, value] of [["source", source.slug], ["tokens", tokens.slug], ["manifest", manifest.slug]]) {
    if (value !== expectedSlug) errors.push(`${label} slug differs from ${expectedSlug}`);
  }
  for (const [label, value] of [["tokens", tokens.brandVersion], ["manifest", manifest.brandVersion]]) {
    if (value !== expectedVersion) errors.push(`${label} brandVersion differs from source`);
  }
  if (tokens.sourceHash !== manifest.sourceHash) errors.push("tokens sourceHash differs from manifest");

  for (const group of ["artifacts", "assetHashes"] as const) {
    const hashes = manifest[group];
    if (!hashes || typeof hashes !== "object" || Array.isArray(hashes)) {
      errors.push(`manifest ${group} is invalid`);
      continue;
    }
    for (const [file, expected] of Object.entries(hashes as Record<string, unknown>)) {
      const path = resolve(pack.root, file);
      if (!(await exists(path))) errors.push(`Missing declared file ${file}`);
      else if (typeof expected !== "string" || await sha256(path) !== expected) errors.push(`Hash mismatch for ${file}`);
    }
  }

  return {
    slug: pack.slug,
    root: pack.root,
    brandVersion: expectedVersion,
    schemaVersion: source.schemaVersion,
    sourceHash: manifest.sourceHash,
    valid: errors.length === 0,
    errors,
  };
}

async function context() {
  const validation = await validatePack();
  if (!validation.valid) return validation;

  const surface = option("surface") as Surface | undefined;
  if (!surface || !["site", "product", "presentation", "document"].includes(surface)) {
    throw new Error("Use --surface site|product|presentation|document.");
  }

  const root = validation.root;
  const source = await json(resolve(root, "brand.source.json"));
  const tokens = await json(resolve(root, "tokens.json"));
  const surfaces = source.surfaces as Record<string, unknown> | undefined;
  return {
    valid: true,
    slug: validation.slug,
    brandVersion: validation.brandVersion,
    surface,
    rules: surfaces?.[surface] ?? [],
    identity: source.identity,
    voice: source.voice,
    colors: tokens.colors,
    typography: tokens.typography,
    layout: tokens.layout,
    motion: tokens.motion,
    assets: tokens.assets,
    iconography: source.iconography ?? null,
  };
}

async function main() {
  let result: unknown;
  if (command === "status") result = await inspectPack();
  else if (command === "validate") result = await validatePack();
  else if (command === "context") result = await context();
  else throw new Error("Unknown command. Use status, validate, or context.");

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (command === "validate" && !(result as { valid?: boolean }).valid) process.exitCode = 1;
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
