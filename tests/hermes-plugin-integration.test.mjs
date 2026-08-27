import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
  validateHermesRuntimeUpdate,
  validatePortablePluginManifest,
} from "../scripts/validate-hermes-plugin.mjs";

const root = resolve(import.meta.dirname, "..");

async function readJson(path) {
  return JSON.parse(await readFile(resolve(root, path), "utf8"));
}

async function readText(path) {
  return readFile(resolve(root, path), "utf8");
}

test("accepts the canonical closed Agent Plugins v1 manifest", async () => {
  const manifest = await readJson("plugins/brand-runtime/plugin.json");

  assert.doesNotThrow(() => validatePortablePluginManifest(manifest));
});

test("rejects unknown portable manifest fields and malformed metadata", () => {
  assert.throws(
    () => validatePortablePluginManifest({
      $schema: "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
      name: "brand-runtime",
      capabilities: [],
    }),
    /unknown top-level field: capabilities/,
  );

  assert.throws(
    () => validatePortablePluginManifest({
      $schema: "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
      name: "brand-runtime",
      author: { name: "smartscaile.", role: "publisher" },
    }),
    /unknown author field: role/,
  );

  assert.throws(
    () => validatePortablePluginManifest({
      $schema: "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
      name: "brand-runtime",
      keywords: ["brand", 42],
    }),
    /keywords must contain only strings/,
  );

  assert.throws(
    () => validatePortablePluginManifest({
      $schema: "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
      name: "brand-runtime",
      extensions: { "com.example": "not-an-object" },
    }),
    /extension com\.example must be an object/,
  );
});

test("requires the executable managed Hermes update mode", async () => {
  const contract = await readJson("plugins/brand-runtime/skills/brand/references/runtime-update.json");

  assert.doesNotThrow(() => validateHermesRuntimeUpdate(contract));
  assert.equal(contract.runtimes.hermes.agentCommands, undefined);
  assert.deepEqual(contract.runtimes.hermes.managedSource.agentCommands, [
    "hermes plugins install smartscaile/brand-runtime/plugins/brand-runtime --force --enable",
    "hermes plugins doctor brand-runtime --ci",
    "hermes plugins show brand-runtime",
  ]);
  assert.equal(contract.runtimes.hermes.linkedSource, undefined);

  const unsafe = structuredClone(contract);
  unsafe.runtimes.hermes.agentCommands = unsafe.runtimes.hermes.managedSource.agentCommands;
  assert.throws(
    () => validateHermesRuntimeUpdate(unsafe),
    /must not define unconditional agentCommands/,
  );
});

test("documents plugin skill discovery through skills_list", async () => {
  const readme = await readText("README.md");
  const pluginReadme = await readText("plugins/brand-runtime/README.md");

  assert.match(readme, /`skills_list`/);
  assert.match(pluginReadme, /`skills_list`/);
  assert.doesNotMatch(readme, /`hermes skills list`/);
  assert.doesNotMatch(pluginReadme, /`hermes skills list`/);
});
