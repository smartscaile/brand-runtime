import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

async function readJson(path) {
  return JSON.parse(await readFile(resolve(root, path), "utf8"));
}

function expect(value, message) {
  if (!value) throw new Error(message);
}

const codexMarketplace = await readJson(".agents/plugins/marketplace.json");
const claudeMarketplace = await readJson(".claude-plugin/marketplace.json");
const codexPlugin = await readJson("plugins/brand-runtime/.codex-plugin/plugin.json");
const claudePlugin = await readJson("plugins/brand-runtime/.claude-plugin/plugin.json");
const packageManifest = await readJson("package.json");

function baseVersion(version) {
  return typeof version === "string" ? version.split("+")[0] : version;
}

expect(codexMarketplace.name === "smartscaile", "Codex marketplace publisher must be smartscaile.");
expect(claudeMarketplace.name === "smartscaile", "Claude marketplace publisher must be smartscaile.");
expect(codexMarketplace.plugins?.[0]?.source?.path === "./plugins/brand-runtime", "Codex marketplace source must target Brand Runtime.");
expect(claudeMarketplace.plugins?.[0]?.source === "./plugins/brand-runtime", "Claude marketplace source must target Brand Runtime.");
expect(codexMarketplace.plugins?.[0]?.policy?.installation === "AVAILABLE", "Codex installation policy must be AVAILABLE.");
expect(codexMarketplace.plugins?.[0]?.policy?.authentication === "ON_INSTALL", "Codex authentication policy must be ON_INSTALL.");
expect(codexPlugin.name === "brand-runtime", "Codex plugin id must be brand-runtime.");
expect(claudePlugin.name === "brand-runtime", "Claude plugin id must be brand-runtime.");
expect(codexPlugin.interface?.displayName === "Brand Runtime", "Codex display name must be Brand Runtime.");
expect(claudePlugin.displayName === "Brand Runtime", "Claude display name must be Brand Runtime.");
expect(codexPlugin.author?.name === "smartscaile.", "Codex author must be smartscaile.");
expect(claudePlugin.author?.name === "smartscaile.", "Claude author must be smartscaile.");
expect(baseVersion(codexPlugin.version) === packageManifest.version, "Codex plugin base version must match package.json.");
expect(baseVersion(claudePlugin.version) === packageManifest.version, "Claude plugin base version must match package.json.");

for (const path of [
  "plugins/brand-runtime/hooks/hooks.json",
  "plugins/brand-runtime/scripts/brand-command-hook.mjs",
  "plugins/brand-runtime/scripts/brand-root-config.mjs",
  "plugins/brand-runtime/skills/brand/SKILL.md",
  "plugins/brand-runtime/skills/brand/references/brand-root-config.json",
  "plugins/brand-runtime/skills/brand/references/client-rules-contract.json",
  "plugins/brand-runtime/skills/brand/scripts/brand.ts",
  "plugins/brand-runtime/skills/brand/tasks/brand-learn.json",
]) {
  await access(resolve(root, path));
}

process.stdout.write("Brand Runtime repository structure is valid.\n");
