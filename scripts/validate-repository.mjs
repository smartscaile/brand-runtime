import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

async function readJson(path) {
  return JSON.parse(await readFile(resolve(root, path), "utf8"));
}

async function readText(path) {
  return readFile(resolve(root, path), "utf8");
}

async function exists(path) {
  try {
    await access(resolve(root, path));
    return true;
  } catch {
    return false;
  }
}

function expect(value, message) {
  if (!value) throw new Error(message);
}

function baseVersion(version) {
  return typeof version === "string" ? version.split("+")[0] : version;
}

const codexMarketplace = await readJson(".agents/plugins/marketplace.json");
const claudeMarketplace = await readJson(".claude-plugin/marketplace.json");
const codexPlugin = await readJson("plugins/brand-runtime/.codex-plugin/plugin.json");
const claudePlugin = await readJson("plugins/brand-runtime/.claude-plugin/plugin.json");
const packageManifest = await readJson("package.json");
const runtimeUpdate = await readJson("plugins/brand-runtime/skills/brand/references/runtime-update.json");
const skill = await readText("plugins/brand-runtime/skills/brand/SKILL.md");
const foundation = await readText("plugins/brand-runtime/skills/brand/references/design-foundation.md");
const directionTemplate = await readText("plugins/brand-runtime/skills/brand/references/design-direction-template.md");
const projectLearning = await readText("plugins/brand-runtime/skills/brand/references/project-learning.md");
const stackSelection = await readText("plugins/brand-runtime/skills/brand/references/stack-selection.md");
const surfaceGuidelines = await readText("plugins/brand-runtime/skills/brand/references/surface-guidelines.md");

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

expect(skill.split("\n").length < 500, "Brand SKILL.md must stay below 500 lines.");
expect(skill.startsWith("---\nname: brand\ndescription:"), "Brand SKILL.md must declare canonical frontmatter.");
expect(skill.includes("Require a validated Brand Pack before applying or claiming an official brand identity"), "Brand skill must require a Brand Pack for official identity.");
expect(skill.includes("Allow `brand-pending`"), "Brand skill must retain provisional direction without a Brand Pack.");
expect(skill.includes("never tell the user to continue without Brand Runtime"), "Brand skill must remain the director in brand-pending.");
expect(skill.includes(">>brand start [--project <name-or-path>] [--brand <slug>]"), "Brand skill must define the project-start command.");
expect(skill.includes("A host working directory and an explicit `--project` hint still require confirmation"), "Brand skill must require exact project confirmation.");
expect(skill.includes("never require `projects/`"), "Brand skill must remain independent of client directory layout.");
expect(skill.includes("A technically valid pack is still unusable"), "Brand skill must block a Brand Pack that belongs to another represented brand.");
expect(skill.includes("### Step 2 — Discover the deliverable"), "Brand skill must discover the deliverable before direction.");
expect(skill.includes("active brand rules returned by `context`"), "Brand skill must define rule precedence.");
expect(skill.includes("stop and request clarification instead of inventing"), "Brand skill must block unresolved rule conflicts.");
expect(skill.includes("references/design-foundation.md"), "Brand skill must load the universal design foundation.");
expect(skill.includes("docs/design/design-direction.md"), "Brand skill must create a project-local design direction.");
expect(skill.includes("## Project learning"), "Brand skill must retain project-first learning.");
expect(skill.includes("--scope project"), "Brand skill must write project knowledge explicitly.");
expect(skill.includes("## Brand rule promotion"), "Brand skill must retain explicit brand-rule promotion.");
expect(skill.includes("references/stack-selection.md"), "Brand skill must route stack decisions to curated guidance.");
expect(skill.includes("## Runtime update"), "Brand skill must retain the runtime-update boundary.");
expect(skill.includes("### Step 7 — Validate and refine"), "Brand skill must contain its canonical quality gate.");

expect(foundation.includes("identity-neutral"), "Design foundation must declare its identity-neutral boundary.");
expect(foundation.includes("Never treat this foundation as a fallback Brand Pack"), "Design foundation must not replace a Brand Pack.");
expect(!/#[0-9a-f]{3,8}\b/i.test(foundation), "Design foundation must not embed brand color values.");
expect(!/smartscaile|checkgrow|wascen/i.test(foundation), "Design foundation must not contain client or publisher identity rules.");
expect(directionTemplate.includes("### Official identity source"), "Design direction must separate official identity from project decisions.");
expect(directionTemplate.includes("### Project decisions"), "Design direction must identify project-owned decisions.");
expect(directionTemplate.includes("mode: <brand-pack|brand-pending>"), "Design direction must record its authority mode.");
expect(directionTemplate.includes("identity_claim: <official|none>"), "Design direction must record whether identity is official.");
expect(directionTemplate.includes("provisional: <true|false>"), "Design direction must record provisional status.");
expect(directionTemplate.includes("brand_version:"), "Design direction must record Brand Pack version provenance.");
expect(directionTemplate.includes("brand_rules_revision:"), "Design direction must record brand-rules provenance.");
expect(directionTemplate.includes("## Stack and implementation"), "Design direction must record the selected stack and fallbacks.");
expect(projectLearning.includes("Markdown is the source of truth for project knowledge"), "Project learning must use Markdown as the contextual source of truth.");
expect(projectLearning.includes("A reference to another project is provenance, not inheritance"), "Cross-project reuse must not create implicit inheritance.");
expect(projectLearning.includes('mode: "brand-pending"'), "Project learning must support brand-pending provenance.");
expect(stackSelection.includes("Treat the catalog as curated options, never as universal defaults"), "Stack guidance must remain consultative.");
for (const library of ["React Bits", "Uiverse", "Motion", "Anime.js", "GSAP", "Three.js"]) {
  expect(stackSelection.includes(`### ${library}`), `Stack selection must describe ${library}.`);
}

for (const surface of ["## Site", "## Product", "## Document", "## Presentation"]) {
  expect(surfaceGuidelines.includes(surface), `Surface guidelines must include ${surface.slice(3)}.`);
}

expect(
  runtimeUpdate.runtimes?.claude?.agentCommands?.join("\n")
    === [
      "claude plugin marketplace update smartscaile",
      "claude plugin update brand-runtime@smartscaile",
      "claude plugin list --json",
    ].join("\n"),
  "Runtime update contract must define the canonical Claude Code update sequence.",
);

expect(
  runtimeUpdate.runtimes?.codex?.agentCommands?.join("\n")
    === [
      "codex plugin marketplace upgrade smartscaile",
      "codex plugin add brand-runtime@smartscaile",
      "codex plugin list",
    ].join("\n"),
  "Runtime update contract must define the canonical Codex update sequence.",
);

for (const path of [
  "plugins/brand-runtime/hooks/hooks.json",
  "plugins/brand-runtime/scripts/brand-command-hook.mjs",
  "plugins/brand-runtime/scripts/brand-root-config.mjs",
  "plugins/brand-runtime/skills/brand/SKILL.md",
  "plugins/brand-runtime/skills/brand/references/brand-pack-contract.json",
  "plugins/brand-runtime/skills/brand/references/brand-root-config.json",
  "plugins/brand-runtime/skills/brand/references/client-rules-contract.json",
  "plugins/brand-runtime/skills/brand/references/design-foundation.md",
  "plugins/brand-runtime/skills/brand/references/design-direction-template.md",
  "plugins/brand-runtime/skills/brand/references/project-learning.md",
  "plugins/brand-runtime/skills/brand/references/stack-selection.md",
  "plugins/brand-runtime/skills/brand/references/surface-guidelines.md",
  "plugins/brand-runtime/skills/brand/references/runtime-update.json",
  "plugins/brand-runtime/skills/brand/scripts/brand.ts",
]) {
  await access(resolve(root, path));
}

for (const legacyPath of [
  "plugins/brand-runtime/skills/brand/rules/general.json",
  "plugins/brand-runtime/skills/brand/tasks/brand-apply.json",
  "plugins/brand-runtime/skills/brand/tasks/brand-learn.json",
  "plugins/brand-runtime/skills/brand/tasks/brand-update-runtime.json",
  "plugins/brand-runtime/skills/brand/checklists/brand-quality-gate.json",
  "plugins/brand-runtime/skills/brand/references/dependency-map.json",
  "plugins/brand-runtime/skills/brand/references/editorial-surface-guidelines.json",
  "plugins/brand-runtime/skills/brand/adapters/openai.yaml",
  "plugins/brand-runtime/skills/brand/agents/openai.yaml",
  "plugins/brand-runtime/skills/brand/assets/icon.png",
  "plugins/brand-runtime/skills/brand/assets/logo-dark.png",
  "plugins/brand-runtime/skills/brand/assets/logo.png",
]) {
  expect(!(await exists(legacyPath)), `Legacy duplicate must be removed: ${legacyPath}`);
}

process.stdout.write("Brand Runtime repository structure is valid.\n");
