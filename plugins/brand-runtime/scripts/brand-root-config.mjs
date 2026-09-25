import { randomUUID } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, resolve } from "node:path";

export const BRAND_ROOT_CONFIG_SCHEMA_VERSION = "1.0.0";
export const BRAND_ROOT_CONFIG_ENV = "BRAND_RUNTIME_CONFIG";
export const BRAND_ROOT_ENV = "BRAND_RUNTIME_BRAND_ROOT";

const BRAND_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PACK_MARKER = "brand.source.json";

function isDirectory(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function hasPathEntry(path) {
  try {
    lstatSync(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") return false;
    throw error;
  }
}

function configBase(env, platform) {
  if (platform === "win32") {
    return env.APPDATA || resolve(homedir(), "AppData", "Roaming");
  }
  return env.XDG_CONFIG_HOME || resolve(homedir(), ".config");
}

export function brandRuntimeConfigPath({ env = process.env, platform = process.platform } = {}) {
  const explicit = env[BRAND_ROOT_CONFIG_ENV]?.trim();
  if (explicit) return resolve(explicit);
  return resolve(configBase(env, platform), "brand-runtime", "config.json");
}

export function discoverBrands(brandRoot) {
  if (!isDirectory(brandRoot)) return [];
  return readdirSync(brandRoot, { withFileTypes: true })
    .filter((entry) => BRAND_SLUG.test(entry.name))
    .filter((entry) => entry.isDirectory() || entry.isSymbolicLink() && isDirectory(resolve(brandRoot, entry.name)))
    .filter((entry) => existsSync(resolve(brandRoot, entry.name, PACK_MARKER)))
    .map((entry) => entry.name)
    .sort();
}

export function inspectBrandRoot(path) {
  if (typeof path !== "string" || !path.trim()) {
    return { ok: false, status: "missing", reason: "No brand root path was provided.", brands: [] };
  }
  if (!isAbsolute(path)) {
    return { ok: false, status: "invalid", reason: "The brand root path must be absolute.", brandRoot: path, brands: [] };
  }

  const brandRoot = resolve(path);
  if (basename(brandRoot).toLowerCase() !== "brand") {
    return {
      ok: false,
      status: "invalid",
      reason: "The configured path must point to the folder named brand, not to an individual Brand Pack.",
      brandRoot,
      brands: [],
    };
  }
  if (!existsSync(brandRoot)) {
    return { ok: false, status: "stale", reason: "The configured brand folder does not exist.", brandRoot, brands: [] };
  }
  if (!isDirectory(brandRoot)) {
    return { ok: false, status: "invalid", reason: "The configured brand root is not a directory.", brandRoot, brands: [] };
  }

  const brands = discoverBrands(brandRoot);
  if (brands.length === 0) {
    return {
      ok: false,
      status: "empty",
      reason: "The selected brand folder contains no Brand Pack directories.",
      brandRoot,
      brands,
    };
  }
  return { ok: true, status: "ready", brandRoot, brands };
}

function inspectBrandRootBindings(bindings = {}, brandRoots) {
  const invalid = (reason) => ({ ok: false, status: "invalid-config", reason: `brandRootsBySlug: ${reason}` });
  if (bindings === null || typeof bindings !== "object" || Array.isArray(bindings)) {
    return invalid("must be an object mapping brand slugs to absolute registered brand folders.");
  }
  const entries = [];
  for (const [slug, path] of Object.entries(bindings)) {
    if (!BRAND_SLUG.test(slug)) return invalid(`Invalid brand slug "${slug}"; use lowercase kebab-case.`);
    if (typeof path !== "string" || !isAbsolute(path)) return invalid(`"${slug}" must name an absolute brand folder.`);
    const brandRoot = resolve(path);
    if (!brandRoots.includes(brandRoot)) return invalid(`"${slug}" points to an unregistered brand folder: ${path}`);
    const pack = resolve(brandRoot, slug);
    if (!isDirectory(pack) || !existsSync(resolve(pack, PACK_MARKER))) {
      return {
        ok: false,
        status: "stale-binding",
        reason: `brandRootsBySlug: "${slug}" requires a Pack directory with ${PACK_MARKER} at ${pack}. No other copy will be selected.`,
      };
    }
    entries.push([slug, brandRoot]);
  }
  return { ok: true, brandRootsBySlug: Object.fromEntries(entries) };
}

export function readBrandRootConfig({ env = process.env } = {}) {
  const configFile = brandRuntimeConfigPath({ env });
  if (!existsSync(configFile)) {
    return {
      ok: false,
      status: "unconfigured",
      reason: "Brand Runtime has no saved brand folder.",
      configFile,
      brands: [],
    };
  }

  let config;
  try {
    config = JSON.parse(readFileSync(configFile, "utf8"));
  } catch (error) {
    return {
      ok: false,
      status: "invalid-config",
      reason: `Brand Runtime config is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
      configFile,
      brands: [],
    };
  }

  if (config?.schemaVersion !== BRAND_ROOT_CONFIG_SCHEMA_VERSION || typeof config?.brandRoot !== "string") {
    return {
      ok: false,
      status: "invalid-config",
      reason: `Brand Runtime config must use schema ${BRAND_ROOT_CONFIG_SCHEMA_VERSION} and declare brandRoot.`,
      configFile,
      configuredBrandRoot: typeof config?.brandRoot === "string" ? config.brandRoot : undefined,
      brands: [],
    };
  }

  if (config.additionalBrandRoots !== undefined && (
    !Array.isArray(config.additionalBrandRoots)
    || config.additionalBrandRoots.some((path) => typeof path !== "string")
  )) {
    return {
      ok: false,
      status: "invalid-config",
      reason: "additionalBrandRoots must be an array of absolute brand folder path strings.",
      configFile,
      configuredBrandRoot: config.brandRoot,
      brandRoots: [],
      brands: [],
    };
  }

  const paths = [config.brandRoot, ...(config.additionalBrandRoots || [])];
  // Inspect the original strings before normalization; a relative path is not a valid config value.
  const inspections = paths.map(inspectBrandRoot);
  const failedIndex = inspections.findIndex((root) => !root.ok);
  const inspected = inspections[failedIndex] || inspections[0];
  const brandRoots = [...new Set(inspections.map((root, index) => root.brandRoot ?? paths[index]))];
  const brands = [...new Set(inspections.flatMap((root) => root.brands))].sort();
  const duplicateBrands = (failedIndex < 0 ? brands : []).map((slug) => ({
    slug,
    brandRoots: brandRoots.filter((root) => hasPathEntry(resolve(root, slug))),
  })).filter((entry) => entry.brandRoots.length > 1);
  const bindings = inspectBrandRootBindings(config.brandRootsBySlug, brandRoots);
  const brandRootsBySlug = bindings.brandRootsBySlug || {};
  const unresolvedDuplicates = duplicateBrands.filter(({ slug }) => !Object.hasOwn(brandRootsBySlug, slug));
  const resolvedDuplicateBrands = duplicateBrands
    .filter(({ slug }) => Object.hasOwn(brandRootsBySlug, slug))
    .map((entry) => ({ ...entry, brandRoot: brandRootsBySlug[entry.slug] }));
  return {
    ...inspected,
    ...(failedIndex > 0 ? { reason: `additionalBrandRoots[${failedIndex - 1}]: ${inspected.reason} Path: ${paths[failedIndex]}` } : {}),
    ...(failedIndex < 0 && unresolvedDuplicates.length ? { ok: false, status: "ambiguous", reason: duplicateBrandReason(unresolvedDuplicates) } : {}),
    ...(failedIndex < 0 && !bindings.ok ? bindings : {}),
    brandRoot: brandRoots[0],
    brandRoots,
    brands,
    brandRootsBySlug,
    duplicateBrands,
    resolvedDuplicateBrands,
    source: "user-config",
    configFile,
    configuredBrandRoot: config.brandRoot,
    updatedAt: config.updatedAt,
  };
}

function duplicateBrandReason(duplicates) {
  return `Ambiguous Brand Packs found in multiple configured brand folders: ${duplicates.map(({ slug, brandRoots }) => `"${slug}" (${brandRoots.join(", ")})`).join("; ")}. Select an explicit brand root; never use the first copy implicitly.`;
}

export function findProjectBrandRoot(start) {
  let current = resolve(start);
  while (true) {
    const candidate = resolve(current, "brand");
    if (isDirectory(candidate)) return candidate;
    const parent = dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
}

function inspectResolvedRoot(path, source, extra = {}) {
  return {
    ...inspectBrandRoot(path),
    source,
    ...extra,
  };
}

export function resolveBrandRoot({
  cwd = process.cwd(),
  brand,
  explicitBrandRoot,
  explicitProjectRoot,
  env = process.env,
} = {}) {
  if (brand !== undefined && (typeof brand !== "string" || !BRAND_SLUG.test(brand))) {
    return { ok: false, status: "invalid-brand", reason: "The requested brand slug must be lowercase kebab-case.", brandRoots: [], brands: [] };
  }
  if (explicitBrandRoot) {
    return inspectResolvedRoot(resolve(cwd, explicitBrandRoot), "explicit");
  }
  let projectSearchRoot = cwd;
  if (explicitProjectRoot) {
    projectSearchRoot = resolve(cwd, explicitProjectRoot);
    const explicitProjectBrandRoot = resolve(projectSearchRoot, "brand");
    if (isDirectory(explicitProjectBrandRoot)) {
      return inspectResolvedRoot(explicitProjectBrandRoot, "project-root");
    }
  }

  const environmentRoot = env[BRAND_ROOT_ENV]?.trim();
  if (environmentRoot) {
    return inspectResolvedRoot(resolve(projectSearchRoot, environmentRoot), "environment", { environmentVariable: BRAND_ROOT_ENV });
  }

  const projectBrandRoot = findProjectBrandRoot(projectSearchRoot);
  // Presence, not pack validity, owns local precedence. Invalid local packs must not be masked.
  if (projectBrandRoot && (!brand || hasPathEntry(resolve(projectBrandRoot, brand)))) {
    return inspectResolvedRoot(projectBrandRoot, "project");
  }

  const config = readBrandRootConfig({ env });
  // With no global library, retain the existing local discovery/diagnostics, not another identity.
  if (config.status === "unconfigured" && projectBrandRoot) return inspectResolvedRoot(projectBrandRoot, "project");
  if (!brand || !config.ok && config.status !== "ambiguous") return config;
  if (Object.hasOwn(config.brandRootsBySlug, brand)) {
    return { ...config, ok: true, status: "ready", reason: undefined, brandRoot: config.brandRootsBySlug[brand] };
  }
  const matchingRoots = config.brandRoots.filter((root) => hasPathEntry(resolve(root, brand)));
  if (matchingRoots.length > 1) {
    return { ...config, ok: false, status: "ambiguous", reason: duplicateBrandReason([{ slug: brand, brandRoots: matchingRoots }]) };
  }
  if (matchingRoots.length === 0) {
    return {
      ...config,
      ok: false,
      status: "brand-not-found",
      reason: `Brand Pack "${brand}" is not installed in the configured brand folders.`,
    };
  }
  return { ...config, ok: true, status: "ready", reason: undefined, brandRoot: matchingRoots[0] };
}

export function writeBrandRootConfig(brandRoot, { env = process.env } = {}) {
  if (!isAbsolute(brandRoot)) throw new Error("The brand root path must be absolute.");
  const absoluteRoot = resolve(brandRoot);
  const inspected = inspectBrandRoot(absoluteRoot);
  if (!inspected.ok) throw new Error(`${inspected.reason} Path: ${absoluteRoot}`);

  const document = {
    schemaVersion: BRAND_ROOT_CONFIG_SCHEMA_VERSION,
    brandRoot: inspected.brandRoot,
    updatedAt: new Date().toISOString(),
  };
  return persistBrandRootConfig(document, { env });
}

export function addBrandRootConfig(brandRoot, { env = process.env } = {}) {
  const inspected = inspectBrandRoot(brandRoot);
  if (!inspected.ok) throw new Error(`${inspected.reason} Path: ${brandRoot}`);
  const current = readBrandRootConfig({ env });
  if (current.status === "unconfigured") {
    return { ...writeBrandRootConfig(brandRoot, { env }), changed: true };
  }
  if (!current.ok && current.status !== "ambiguous") throw new Error(current.reason);
  if (current.brandRoots.includes(inspected.brandRoot)) return { ...current, changed: false };
  const document = {
    schemaVersion: BRAND_ROOT_CONFIG_SCHEMA_VERSION,
    brandRoot: current.brandRoot,
    additionalBrandRoots: [...current.brandRoots.slice(1), inspected.brandRoot],
    ...(Object.keys(current.brandRootsBySlug).length ? { brandRootsBySlug: current.brandRootsBySlug } : {}),
    updatedAt: new Date().toISOString(),
  };
  return { ...persistBrandRootConfig(document, { env }), changed: true };
}

export function bindBrandRootConfig(brand, brandRoot, { env = process.env } = {}) {
  if (typeof brand !== "string" || !BRAND_SLUG.test(brand)) {
    throw new Error("The requested brand slug must be lowercase kebab-case.");
  }
  const current = readBrandRootConfig({ env });
  if (!current.ok && current.status !== "ambiguous") throw new Error(current.reason);
  const binding = inspectBrandRootBindings({ [brand]: brandRoot }, current.brandRoots);
  if (!binding.ok) throw new Error(binding.reason);
  const selectedRoot = binding.brandRootsBySlug[brand];
  if (current.brandRootsBySlug[brand] === selectedRoot) return { ...current, changed: false };
  const document = {
    schemaVersion: BRAND_ROOT_CONFIG_SCHEMA_VERSION,
    brandRoot: current.brandRoot,
    ...(current.brandRoots.length > 1 ? { additionalBrandRoots: current.brandRoots.slice(1) } : {}),
    brandRootsBySlug: { ...current.brandRootsBySlug, ...binding.brandRootsBySlug },
    updatedAt: new Date().toISOString(),
  };
  return { ...persistBrandRootConfig(document, { env }), changed: true };
}

function persistBrandRootConfig(document, { env }) {
  const configFile = brandRuntimeConfigPath({ env });
  mkdirSync(dirname(configFile), { recursive: true });
  const temporary = resolve(dirname(configFile), `.config.${randomUUID()}.tmp`);
  try {
    writeFileSync(temporary, `${JSON.stringify(document, null, 2)}\n`, "utf8");
    renameSync(temporary, configFile);
  } finally {
    rmSync(temporary, { force: true });
  }

  return readBrandRootConfig({ env });
}
