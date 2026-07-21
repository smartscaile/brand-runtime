#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function readInput() {
  try {
    const raw = readFileSync(0, "utf8");
    return raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function isDirectory(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function findProjectRoot(start) {
  let current = resolve(start);
  while (true) {
    if (isDirectory(resolve(current, "brand"))) return current;
    const parent = dirname(current);
    if (parent === current) return resolve(start);
    current = parent;
  }
}

function installedBrands(projectRoot) {
  const root = resolve(projectRoot, "brand");
  if (!isDirectory(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() || entry.isSymbolicLink() && isDirectory(resolve(root, entry.name)))
    .map((entry) => entry.name)
    .filter((name) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name))
    .sort();
}

function requestedSlug(prompt) {
  const match = prompt.match(/(?:^|\s)>>brand(?:\s+([a-z0-9]+(?:-[a-z0-9]+)*))?(?=\s|$)/iu);
  return match?.[1]?.toLowerCase() || "";
}

function packLabel(brandRoot) {
  const packFile = resolve(brandRoot, "pack.json");
  if (!existsSync(packFile)) return "version not declared";
  try {
    const pack = JSON.parse(readFileSync(packFile, "utf8"));
    return `brand v${pack.brandVersion || "unknown"}, pack v${pack.packVersion || "unknown"}`;
  } catch {
    return "invalid pack.json";
  }
}

function activationContext({ projectRoot, pluginRoot, slug, available }) {
  const skillRoot = resolve(pluginRoot, "skills", "brand");
  const requested = slug || "<not resolved>";
  const selectedRoot = slug ? resolve(projectRoot, "brand", slug) : "";
  const availableLine = available.length > 0 ? available.join(", ") : "none";

  if (!slug || !isDirectory(selectedRoot)) {
    return [
      "BRAND RUNTIME ACTIVE (>>brand detected)",
      "",
      `The requested Brand Pack could not be resolved. Requested: ${requested}. Installed: ${availableLine}.`,
      "Do not create or review branded output until a valid project-scoped Brand Pack is installed or selected.",
      "Ask the user to install the Brand Pack downloaded from the Brand Portal, or to invoke >>brand <installed-slug>.",
      "",
      `Universal skill: ${skillRoot}/SKILL.md`,
      `Project root: ${projectRoot}`,
    ].join("\n");
  }

  const brandRoot = resolve(projectRoot, "brand", slug);
  const cli = resolve(skillRoot, "scripts", "brand.ts");
  return [
    "BRAND RUNTIME ACTIVE (>>brand detected)",
    "",
    `Use the project-scoped Brand Pack at ${brandRoot} (${packLabel(brandRoot)}).`,
    "Read and follow these files completely before creating or reviewing branded output:",
    `1. ${skillRoot}/SKILL.md`,
    `2. ${skillRoot}/rules/general.json`,
    "",
    "Run these checks from the project root before operating:",
    `node --experimental-strip-types \"${cli}\" status --brand ${slug} --project-root \"${projectRoot}\"`,
    `node --experimental-strip-types \"${cli}\" validate --brand ${slug} --project-root \"${projectRoot}\"`,
    "Stop if validation fails. The Brand Pack is the source of truth; do not copy brand-specific rules into the plugin.",
  ].join("\n");
}

function main() {
  const input = readInput();
  const prompt = typeof input.prompt === "string" ? input.prompt : "";
  if (!/(?:^|\s)>>brand(?=\s|$)/u.test(prompt)) return;

  const cwd = typeof input.cwd === "string" && input.cwd
    ? input.cwd
    : process.env.CLAUDE_PROJECT_DIR || process.env.CODEX_PROJECT_DIR || process.cwd();
  const projectRoot = findProjectRoot(cwd);
  const available = installedBrands(projectRoot);
  const requested = requestedSlug(prompt);
  const slug = requested || (available.length === 1 ? available[0] : "");
  const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

  process.stdout.write(`${JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "UserPromptSubmit",
      additionalContext: activationContext({ projectRoot, pluginRoot, slug, available }),
    },
  })}\n`);
}

main();
