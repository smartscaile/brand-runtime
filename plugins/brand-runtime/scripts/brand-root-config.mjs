import { randomUUID } from "node:crypto";
import {
  existsSync,
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

  const inspected = inspectBrandRoot(config.brandRoot);
  return {
    ...inspected,
    source: "user-config",
    configFile,
    configuredBrandRoot: config.brandRoot,
    updatedAt: config.updatedAt,
  };
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
  explicitBrandRoot,
  explicitProjectRoot,
  env = process.env,
} = {}) {
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
  if (projectBrandRoot) return inspectResolvedRoot(projectBrandRoot, "project");

  return readBrandRootConfig({ env });
}

export function writeBrandRootConfig(brandRoot, { env = process.env } = {}) {
  if (!isAbsolute(brandRoot)) throw new Error("The brand root path must be absolute.");
  const absoluteRoot = resolve(brandRoot);
  const inspected = inspectBrandRoot(absoluteRoot);
  if (!inspected.ok) throw new Error(`${inspected.reason} Path: ${absoluteRoot}`);

  const configFile = brandRuntimeConfigPath({ env });
  const document = {
    schemaVersion: BRAND_ROOT_CONFIG_SCHEMA_VERSION,
    brandRoot: inspected.brandRoot,
    updatedAt: new Date().toISOString(),
  };
  mkdirSync(dirname(configFile), { recursive: true });
  const temporary = resolve(dirname(configFile), `.config.${randomUUID()}.tmp`);
  try {
    writeFileSync(temporary, `${JSON.stringify(document, null, 2)}\n`, "utf8");
    renameSync(temporary, configFile);
  } finally {
    rmSync(temporary, { force: true });
  }

  return {
    ok: true,
    status: "ready",
    source: "user-config",
    configFile,
    brandRoot: inspected.brandRoot,
    brands: inspected.brands,
    updatedAt: document.updatedAt,
  };
}
