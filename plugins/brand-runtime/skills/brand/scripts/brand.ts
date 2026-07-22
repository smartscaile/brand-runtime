import { createHash, randomUUID } from "node:crypto";
import { access, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  readBrandRootConfig,
  resolveBrandRoot,
  writeBrandRootConfig,
} from "../../../scripts/brand-root-config.mjs";

type JsonObject = Record<string, unknown>;
type Surface = "site" | "product" | "presentation" | "document";
type RuleSurface = Surface | "all";
type RuleSeverity = "critical" | "high" | "medium" | "low";
type RuleStatus = "active" | "deprecated";

type ClientRule = {
  id: string;
  status: RuleStatus;
  severity: RuleSeverity;
  surfaces: RuleSurface[];
  instruction: string;
  rationale?: string;
  feedback: string;
  evidence?: string[];
  supersedes?: string[];
  createdAt: string;
  updatedAt: string;
};

type ClientRulesFile = {
  schemaVersion: typeof CLIENT_RULES_SCHEMA_VERSION;
  slug: string;
  revision: number;
  updatedAt: string;
  rules: ClientRule[];
};

const CLIENT_RULES_FILE = "brand.rules.json";
const CLIENT_RULES_SCHEMA_VERSION = "1.0.0";
const SURFACES: Surface[] = ["site", "product", "presentation", "document"];
const RULE_SURFACES: RuleSurface[] = ["all", ...SURFACES];
const RULE_SEVERITIES: RuleSeverity[] = ["critical", "high", "medium", "low"];
const RULE_STATUSES: RuleStatus[] = ["active", "deprecated"];
const args = process.argv.slice(2);
const command = args[0] ?? "status";
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolve(scriptDirectory, "../../..");

function options(name: string): string[] {
  const values: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === `--${name}` && args[index + 1]) values.push(args[index + 1]!);
  }
  return values;
}

function option(name: string): string | undefined {
  return options(name)[0];
}

function requiredOption(name: string): string {
  const value = option(name)?.trim();
  if (!value) throw new Error(`Use --${name} <value>.`);
  return value;
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function json(path: string): Promise<JsonObject> {
  return JSON.parse(await readFile(path, "utf8")) as JsonObject;
}

async function sha256(path: string): Promise<string> {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

async function runtimeVersion(): Promise<string> {
  for (const relativePath of [".codex-plugin/plugin.json", ".claude-plugin/plugin.json"]) {
    try {
      const manifest = await json(resolve(pluginRoot, relativePath));
      if (typeof manifest.version === "string" && manifest.version) return manifest.version;
    } catch {
      // Try the next runtime manifest.
    }
  }
  return "unknown";
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

function assertRuleId(id: string): void {
  if (!/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(id)) {
    throw new Error(`Invalid rule id "${id}". Use lowercase dot- or kebab-delimited text.`);
  }
}

function packPath(root: string, relativePath: string): string {
  if (!relativePath || isAbsolute(relativePath)) throw new Error(`Invalid Brand Pack path "${relativePath}".`);
  const absolutePath = resolve(root, relativePath);
  const fromRoot = relative(root, absolutePath);
  if (!fromRoot || fromRoot.startsWith("..") || isAbsolute(fromRoot)) {
    throw new Error(`Brand Pack path escapes its root: ${relativePath}`);
  }
  return absolutePath;
}

function resolveBrandsRoot() {
  const resolution = resolveBrandRoot({
    cwd: process.cwd(),
    explicitBrandRoot: option("brand-root"),
    explicitProjectRoot: option("project-root"),
  });
  if (!resolution.ok) {
    const configuredPath = resolution.brandRoot || resolution.configuredBrandRoot;
    const pathDetail = configuredPath ? ` Path: ${configuredPath}.` : "";
    throw new Error(
      `${resolution.reason}${pathDetail} Use config set --brand-root <absolute-path-to-brand-folder>.`,
    );
  }
  return resolution;
}

async function resolveBrand() {
  const resolution = resolveBrandsRoot();
  const brandsRoot = resolution.brandRoot;
  const requested = option("brand") ?? positionalBrand();
  if (requested) {
    assertSlug(requested);
    if (!resolution.brands.includes(requested)) {
      throw new Error(`Brand Pack "${requested}" is not installed. Available: ${resolution.brands.join(", ")}.`);
    }
    return {
      slug: requested,
      root: resolve(brandsRoot, requested),
      brandRoot: brandsRoot,
      brandRootSource: resolution.source,
      availableBrands: resolution.brands,
      configFile: resolution.configFile,
    };
  }

  if (resolution.brands.length !== 1) {
    const detail = resolution.brands.length ? ` Available: ${resolution.brands.join(", ")}.` : "";
    throw new Error(`Use --brand <slug> when zero or multiple Brand Packs are installed.${detail}`);
  }
  const onlyBrand = resolution.brands[0];
  if (!onlyBrand) throw new Error("Brand Pack resolution failed after directory discovery.");
  assertSlug(onlyBrand);
  return {
    slug: onlyBrand,
    root: resolve(brandsRoot, onlyBrand),
    brandRoot: brandsRoot,
    brandRootSource: resolution.source,
    availableBrands: resolution.brands,
    configFile: resolution.configFile,
  };
}

async function inspectClientRules(root: string) {
  const path = resolve(root, CLIENT_RULES_FILE);
  if (!(await exists(path))) {
    return {
      file: CLIENT_RULES_FILE,
      present: false,
      schemaVersion: CLIENT_RULES_SCHEMA_VERSION,
      revision: 0,
      active: 0,
    };
  }

  try {
    const document = await json(path);
    const rules = Array.isArray(document.rules) ? document.rules : [];
    return {
      file: CLIENT_RULES_FILE,
      present: true,
      schemaVersion: document.schemaVersion,
      revision: document.revision,
      active: rules.filter((rule) => isObject(rule) && rule.status === "active").length,
    };
  } catch {
    return {
      file: CLIENT_RULES_FILE,
      present: true,
      schemaVersion: "invalid",
      revision: "invalid",
      active: "invalid",
    };
  }
}

async function inspectPack() {
  const brand = await resolveBrand();
  const required = ["brand.source.json", "tokens.json", "brand-guidelines.md", "build-manifest.json"];
  const present = Object.fromEntries(await Promise.all(required.map(async (file) => [file, await exists(resolve(brand.root, file))])));
  return {
    runtimeVersion: await runtimeVersion(),
    ...brand,
    required,
    present,
    clientRules: await inspectClientRules(brand.root),
  };
}

function validTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && !Number.isNaN(Date.parse(value));
}

function stringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string" && item.length > 0);
}

async function validateClientRules(root: string, slug: string, errors: string[]): Promise<ClientRulesFile | undefined> {
  const path = resolve(root, CLIENT_RULES_FILE);
  if (!(await exists(path))) return undefined;

  let document: JsonObject;
  try {
    document = await json(path);
  } catch (error) {
    errors.push(`${CLIENT_RULES_FILE} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }

  if (document.schemaVersion !== CLIENT_RULES_SCHEMA_VERSION) {
    errors.push(`${CLIENT_RULES_FILE} schemaVersion must be ${CLIENT_RULES_SCHEMA_VERSION}`);
  }
  if (document.slug !== slug) errors.push(`${CLIENT_RULES_FILE} slug differs from ${slug}`);
  if (!Number.isInteger(document.revision) || Number(document.revision) < 1) {
    errors.push(`${CLIENT_RULES_FILE} revision must be a positive integer`);
  }
  if (!validTimestamp(document.updatedAt)) errors.push(`${CLIENT_RULES_FILE} updatedAt must be an ISO timestamp`);
  if (!Array.isArray(document.rules)) {
    errors.push(`${CLIENT_RULES_FILE} rules must be an array`);
    return undefined;
  }

  const seen = new Set<string>();
  const ruleIds = new Set(
    document.rules
      .filter(isObject)
      .map((rule) => rule.id)
      .filter((id): id is string => typeof id === "string"),
  );

  for (const [index, value] of document.rules.entries()) {
    const label = `${CLIENT_RULES_FILE} rules[${index}]`;
    if (!isObject(value)) {
      errors.push(`${label} must be an object`);
      continue;
    }

    const id = value.id;
    if (typeof id !== "string" || !/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(id)) {
      errors.push(`${label}.id is invalid`);
    } else if (seen.has(id)) {
      errors.push(`${label}.id duplicates ${id}`);
    } else {
      seen.add(id);
    }

    if (!RULE_STATUSES.includes(value.status as RuleStatus)) errors.push(`${label}.status is invalid`);
    if (!RULE_SEVERITIES.includes(value.severity as RuleSeverity)) errors.push(`${label}.severity is invalid`);
    if (!stringList(value.surfaces) || value.surfaces.some((surface) => !RULE_SURFACES.includes(surface as RuleSurface))) {
      errors.push(`${label}.surfaces must contain all, site, product, presentation, or document`);
    }
    if (typeof value.instruction !== "string" || !value.instruction.trim()) errors.push(`${label}.instruction is required`);
    if (value.rationale !== undefined && (typeof value.rationale !== "string" || !value.rationale.trim())) {
      errors.push(`${label}.rationale must be a non-empty string when present`);
    }
    if (typeof value.feedback !== "string" || !value.feedback.trim()) errors.push(`${label}.feedback is required`);
    if (!validTimestamp(value.createdAt)) errors.push(`${label}.createdAt must be an ISO timestamp`);
    if (!validTimestamp(value.updatedAt)) errors.push(`${label}.updatedAt must be an ISO timestamp`);

    if (value.evidence !== undefined) {
      if (!stringList(value.evidence)) {
        errors.push(`${label}.evidence must be an array of relative paths`);
      } else {
        for (const evidence of value.evidence) {
          try {
            if (!evidence.startsWith("references/feedback/")) {
              errors.push(`${label}.evidence must live under references/feedback/`);
              continue;
            }
            if (!(await exists(packPath(root, evidence)))) errors.push(`${label}.evidence is missing ${evidence}`);
          } catch (error) {
            errors.push(`${label}.evidence is invalid: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }
    }

    if (value.supersedes !== undefined) {
      if (!stringList(value.supersedes)) {
        errors.push(`${label}.supersedes must be an array of rule ids`);
      } else {
        for (const superseded of value.supersedes) {
          if (superseded === id) errors.push(`${label}.supersedes cannot reference itself`);
          else if (!ruleIds.has(superseded)) errors.push(`${label}.supersedes references unknown rule ${superseded}`);
        }
      }
    }
  }

  return document as ClientRulesFile;
}

async function readPackJson(path: string, label: string, errors: string[]): Promise<JsonObject | undefined> {
  try {
    return await json(path);
  } catch (error) {
    errors.push(`${label} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}

async function validatePack() {
  const pack = await inspectPack();
  const errors: string[] = [];
  for (const file of pack.required) if (!pack.present[file]) errors.push(`Missing ${file}`);

  const clientRules = await validateClientRules(pack.root, pack.slug, errors);
  if (errors.some((error) => error.startsWith("Missing "))) {
    return {
      runtimeVersion: pack.runtimeVersion,
      slug: pack.slug,
      root: pack.root,
      rulesSchemaVersion: clientRules?.schemaVersion ?? CLIENT_RULES_SCHEMA_VERSION,
      rulesRevision: clientRules?.revision ?? 0,
      valid: false,
      errors,
    };
  }

  const source = await readPackJson(resolve(pack.root, "brand.source.json"), "brand.source.json", errors);
  const tokens = await readPackJson(resolve(pack.root, "tokens.json"), "tokens.json", errors);
  const manifest = await readPackJson(resolve(pack.root, "build-manifest.json"), "build-manifest.json", errors);
  if (!source || !tokens || !manifest) {
    return {
      runtimeVersion: pack.runtimeVersion,
      slug: pack.slug,
      root: pack.root,
      rulesSchemaVersion: clientRules?.schemaVersion ?? CLIENT_RULES_SCHEMA_VERSION,
      rulesRevision: clientRules?.revision ?? 0,
      valid: false,
      errors,
    };
  }

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
      let path: string;
      try {
        path = packPath(pack.root, file);
      } catch (error) {
        errors.push(`Invalid declared file ${file}: ${error instanceof Error ? error.message : String(error)}`);
        continue;
      }
      if (!(await exists(path))) errors.push(`Missing declared file ${file}`);
      else if (typeof expected !== "string" || await sha256(path) !== expected) errors.push(`Hash mismatch for ${file}`);
    }
  }

  return {
    runtimeVersion: pack.runtimeVersion,
    slug: pack.slug,
    root: pack.root,
    brandVersion: expectedVersion,
    schemaVersion: source.schemaVersion,
    sourceHash: manifest.sourceHash,
    rulesSchemaVersion: clientRules?.schemaVersion ?? CLIENT_RULES_SCHEMA_VERSION,
    rulesRevision: clientRules?.revision ?? 0,
    activeRules: clientRules?.rules.filter((rule) => rule.status === "active").length ?? 0,
    valid: errors.length === 0,
    errors,
  };
}

async function context() {
  const validation = await validatePack();
  if (!validation.valid) return validation;

  const surface = option("surface") as Surface | undefined;
  if (!surface || !SURFACES.includes(surface)) {
    throw new Error("Use --surface site|product|presentation|document.");
  }

  const root = validation.root;
  const source = await json(resolve(root, "brand.source.json"));
  const tokens = await json(resolve(root, "tokens.json"));
  const surfaces = source.surfaces as Record<string, unknown> | undefined;
  const clientRulesDocument = await validateClientRules(root, validation.slug, []);
  const clientRules = clientRulesDocument?.rules.filter((rule) =>
    rule.status === "active" && (rule.surfaces.includes("all") || rule.surfaces.includes(surface))) ?? [];

  return {
    valid: true,
    runtimeVersion: validation.runtimeVersion,
    slug: validation.slug,
    brandVersion: validation.brandVersion,
    rulesSchemaVersion: validation.rulesSchemaVersion,
    rulesRevision: validation.rulesRevision,
    surface,
    rules: surfaces?.[surface] ?? [],
    clientRules,
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

function splitValues(values: string[]): string[] {
  return [...new Set(values.flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean))];
}

function ruleComparable(rule: ClientRule): Omit<ClientRule, "createdAt" | "updatedAt"> {
  const { createdAt: _createdAt, updatedAt: _updatedAt, ...comparable } = rule;
  return comparable;
}

async function writeJsonAtomic(path: string, value: unknown): Promise<void> {
  const temporary = resolve(dirname(path), `.${CLIENT_RULES_FILE}.${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}

async function learn() {
  const validation = await validatePack();
  if (!validation.valid) {
    throw new Error(`Cannot update client rules until the Brand Pack validates:\n- ${validation.errors.join("\n- ")}`);
  }

  const id = requiredOption("id");
  assertRuleId(id);
  const instruction = requiredOption("instruction");
  const feedback = requiredOption("feedback");
  const rationale = option("rationale")?.trim();
  const severity = (option("severity") ?? "high") as RuleSeverity;
  const status = (option("status") ?? "active") as RuleStatus;
  if (!RULE_SEVERITIES.includes(severity)) throw new Error(`Invalid severity "${severity}".`);
  if (!RULE_STATUSES.includes(status)) throw new Error(`Invalid status "${status}".`);

  const requestedSurfaces = splitValues(options("surface"));
  const surfaces = (requestedSurfaces.length ? requestedSurfaces : ["all"]) as RuleSurface[];
  for (const surface of surfaces) {
    if (!RULE_SURFACES.includes(surface)) throw new Error(`Invalid rule surface "${surface}".`);
  }
  if (surfaces.includes("all") && surfaces.length > 1) throw new Error("Use all by itself when a rule applies to every surface.");

  const evidence = splitValues(options("evidence"));
  for (const evidencePath of evidence) {
    if (!evidencePath.startsWith("references/feedback/")) {
      throw new Error(`Evidence must live under references/feedback/: ${evidencePath}`);
    }
    if (!(await exists(packPath(validation.root, evidencePath)))) throw new Error(`Evidence file does not exist: ${evidencePath}`);
  }

  const supersedes = splitValues(options("supersedes"));
  if (supersedes.includes(id)) throw new Error("A rule cannot supersede itself.");

  const rulesPath = resolve(validation.root, CLIENT_RULES_FILE);
  const current = await validateClientRules(validation.root, validation.slug, []) ?? {
    schemaVersion: CLIENT_RULES_SCHEMA_VERSION,
    slug: validation.slug,
    revision: 0,
    updatedAt: new Date(0).toISOString(),
    rules: [],
  };
  const existingIndex = current.rules.findIndex((rule) => rule.id === id);
  const existing = current.rules[existingIndex];
  if (status === "deprecated" && !existing) throw new Error("Only an existing rule can be deprecated.");
  for (const superseded of supersedes) {
    if (!current.rules.some((rule) => rule.id === superseded)) throw new Error(`Cannot supersede unknown rule ${superseded}.`);
  }

  const now = new Date().toISOString();
  const nextRule: ClientRule = {
    id,
    status,
    severity,
    surfaces,
    instruction,
    ...(rationale ? { rationale } : {}),
    feedback,
    ...(evidence.length ? { evidence } : {}),
    ...(supersedes.length ? { supersedes } : {}),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  if (existing && JSON.stringify(ruleComparable(existing)) === JSON.stringify(ruleComparable(nextRule))) {
    return {
      runtimeVersion: validation.runtimeVersion,
      slug: validation.slug,
      brandVersion: validation.brandVersion,
      rulesSchemaVersion: current.schemaVersion,
      rulesRevision: current.revision,
      changed: false,
      rule: existing,
    };
  }

  const nextRules = [...current.rules];
  if (existingIndex >= 0) nextRules[existingIndex] = nextRule;
  else nextRules.push(nextRule);
  nextRules.sort((left, right) => left.id.localeCompare(right.id));

  const nextDocument: ClientRulesFile = {
    schemaVersion: CLIENT_RULES_SCHEMA_VERSION,
    slug: validation.slug,
    revision: current.revision + 1,
    updatedAt: now,
    rules: nextRules,
  };
  await writeJsonAtomic(rulesPath, nextDocument);

  const updatedValidation = await validatePack();
  if (!updatedValidation.valid) {
    throw new Error(`Client rules were written but failed validation:\n- ${updatedValidation.errors.join("\n- ")}`);
  }

  return {
    runtimeVersion: updatedValidation.runtimeVersion,
    slug: updatedValidation.slug,
    brandVersion: updatedValidation.brandVersion,
    rulesSchemaVersion: updatedValidation.rulesSchemaVersion,
    rulesRevision: updatedValidation.rulesRevision,
    changed: true,
    path: rulesPath,
    rule: nextRule,
  };
}

async function configure() {
  const action = args[1] ?? "show";
  if (action === "show") {
    return {
      runtimeVersion: await runtimeVersion(),
      ...readBrandRootConfig(),
    };
  }
  if (action === "set") {
    const brandRoot = requiredOption("brand-root");
    if (!isAbsolute(brandRoot)) throw new Error("Use an absolute path for --brand-root.");
    return {
      runtimeVersion: await runtimeVersion(),
      ...writeBrandRootConfig(brandRoot),
    };
  }
  throw new Error("Unknown config action. Use config show or config set --brand-root <absolute-path-to-brand-folder>.");
}

async function main() {
  let result: unknown;
  if (command === "status") result = await inspectPack();
  else if (command === "validate") result = await validatePack();
  else if (command === "context") result = await context();
  else if (command === "learn") result = await learn();
  else if (command === "config") result = await configure();
  else throw new Error("Unknown command. Use status, validate, context, learn, or config.");

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (command === "validate" && !(result as { valid?: boolean }).valid) process.exitCode = 1;
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
