import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "../..");

async function readJson(path) {
  return JSON.parse(await readFile(resolve(root, path), "utf8"));
}

async function readText(path) {
  return readFile(resolve(root, path), "utf8");
}

function markdownSection(markdown, heading) {
  const start = markdown.indexOf(`## ${heading}`);
  assert.notEqual(start, -1, `Missing Markdown section: ${heading}`);
  const next = markdown.indexOf("\n## ", start + heading.length + 3);
  return markdown.slice(start, next === -1 ? undefined : next);
}

test("SPECSFY: AC-001 US-001 FR-001 FR-002 NFR-001 requires Brand Runtime v0.6.1 across release metadata", async () => {
  const packageManifest = await readJson("package.json");
  const packageLock = await readJson("package-lock.json");
  const project = await readJson("project.json");
  const portable = await readJson("plugins/brand-runtime/plugin.json");
  const claude = await readJson("plugins/brand-runtime/.claude-plugin/plugin.json");
  const codex = await readJson("plugins/brand-runtime/.codex-plugin/plugin.json");

  assert.equal(packageManifest.version, "0.6.1");
  assert.equal(packageLock.version, "0.6.1");
  assert.equal(packageLock.packages[""].version, "0.6.1");
  assert.equal(project.version.current, "0.6.1");
  assert.equal(portable.version, "0.6.1");
  assert.equal(claude.version, "0.6.1");
  assert.match(codex.version, /^0\.6\.1\+codex\.\d{14}$/);
});

test("SPECSFY: AC-002 US-001 FR-001 FR-002 NFR-001 requires the executable managed Hermes install and update command", async () => {
  const contract = await readJson("plugins/brand-runtime/skills/brand/references/runtime-update.json");
  const readme = await readText("README.md");
  const command = "hermes plugins install smartscaile/brand-runtime/plugins/brand-runtime --force --enable";

  assert.equal(contract.runtimes.hermes.managedSource.agentCommands[0], command);
  assert.match(markdownSection(readme, "Install in Hermes"), new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(markdownSection(readme, "Update in Hermes"), new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("SPECSFY: AC-003 US-001 FR-001 FR-002 NFR-001 forbids Hermes symlink installation guidance", async () => {
  const contract = await readJson("plugins/brand-runtime/skills/brand/references/runtime-update.json");
  const readme = await readText("README.md");
  const pluginReadme = await readText("plugins/brand-runtime/README.md");
  const serializedContract = JSON.stringify(contract.runtimes.hermes);

  assert.equal(contract.runtimes.hermes.linkedSource, undefined);
  assert.doesNotMatch(serializedContract, /symlink|symbolic link|linked.source/i);
  assert.doesNotMatch(readme, /symlink|symbolic link|linked.source/i);
  assert.doesNotMatch(pluginReadme, /symlink|symbolic link|linked.source/i);
});
