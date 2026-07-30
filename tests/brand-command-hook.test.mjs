import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

const hook = resolve(import.meta.dirname, "../plugins/brand-runtime/scripts/brand-command-hook.mjs");

function run(input, environment = {}) {
  const result = spawnSync(process.execPath, [hook], {
    cwd: String(input.cwd || process.cwd()),
    input: JSON.stringify(input),
    encoding: "utf8",
    env: { ...process.env, ...environment },
  });
  assert.equal(result.status, 0, result.stderr || `Hook exited with ${result.status}`);
  return result.stdout.trim();
}

function context(output) {
  return JSON.parse(output).hookSpecificOutput?.additionalContext || "";
}

test("activates Brand Runtime only for >>brand and resolves Brand Packs", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "brand-runtime-hook-"));
  try {
    const brandRoot = resolve(root, "brand/checkgrow");
    await mkdir(brandRoot, { recursive: true });
    await writeFile(resolve(brandRoot, "brand.source.json"), `${JSON.stringify({ slug: "checkgrow", brandVersion: "0.5.1" }, null, 2)}\n`);
    await writeFile(resolve(brandRoot, "brand.rules.json"), `${JSON.stringify({ revision: 3 }, null, 2)}\n`);

    assert.equal(run({ cwd: root, prompt: "ordinary prompt" }), "");

    const explicit = context(run({ cwd: root, prompt: ">>brand checkgrow create a document" }));
    assert.match(explicit, /BRAND RUNTIME ACTIVE/);
    assert.match(explicit, /Brand Runtime: v0\.2\.2/);
    assert.match(explicit, /Brand Pack v0\.5\.1; client rules r3/);
    assert.match(explicit, /brand\/checkgrow/);
    assert.match(explicit, /validate --brand checkgrow/);

    const automatic = context(run({ cwd: root, prompt: ">>brand" }));
    assert.match(automatic, /brand\/checkgrow/);

    const missing = context(run({ cwd: root, prompt: ">>brand missing" }));
    assert.match(missing, /could not be resolved/);
    assert.match(missing, /Brand Portal\/Vox/);
    assert.match(missing, /Never synthesize a pack/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("configures one global brand folder and discovers multiple Brand Packs", async () => {
  const libraryRoot = await mkdtemp(resolve(tmpdir(), "brand-runtime-library-"));
  const consumerRoot = await mkdtemp(resolve(tmpdir(), "brand-runtime-consumer-"));
  try {
    const brandRoot = resolve(libraryRoot, "brand");
    for (const [slug, brandVersion] of [["checkgrow", "0.5.3"], ["wascen", "1.2.0"]]) {
      const packRoot = resolve(brandRoot, slug);
      await mkdir(packRoot, { recursive: true });
      await writeFile(resolve(packRoot, "brand.source.json"), `${JSON.stringify({ slug, brandVersion }, null, 2)}\n`);
    }

    const configFile = resolve(consumerRoot, "config/brand-runtime.json");
    await mkdir(resolve(consumerRoot, "config"), { recursive: true });
    await writeFile(configFile, `${JSON.stringify({
      schemaVersion: "1.0.0",
      brandRoot,
      updatedAt: "2026-07-22T00:00:00.000Z",
    }, null, 2)}\n`);
    const environment = {
      BRAND_RUNTIME_CONFIG: configFile,
      BRAND_RUNTIME_BRAND_ROOT: "",
    };

    const ambiguous = context(run({ cwd: consumerRoot, prompt: ">>brand" }, environment));
    assert.match(ambiguous, /exactly one slug must be selected/);
    assert.match(ambiguous, /checkgrow, wascen/);

    const explicit = context(run({ cwd: consumerRoot, prompt: ">>brand checkgrow" }, environment));
    assert.match(explicit, /Brand Pack v0\.5\.3/);
    assert.match(explicit, /Configured brand folder:/);
    assert.match(explicit, /user-config/);
    assert.match(explicit, /Installed Brand Packs: checkgrow, wascen/);
    assert.match(explicit, /--brand-root/);
  } finally {
    await rm(libraryRoot, { recursive: true, force: true });
    await rm(consumerRoot, { recursive: true, force: true });
  }
});

test("asks for the brand folder when configuration is missing or stale", async () => {
  const consumerRoot = await mkdtemp(resolve(tmpdir(), "brand-runtime-onboarding-"));
  try {
    const configFile = resolve(consumerRoot, "config/brand-runtime.json");
    const environment = {
      BRAND_RUNTIME_CONFIG: configFile,
      BRAND_RUNTIME_BRAND_ROOT: "",
    };

    const missing = context(run({ cwd: consumerRoot, prompt: ">>brand checkgrow" }, environment));
    assert.match(missing, /BRAND FOLDER CONFIGURATION REQUIRED/);
    assert.match(missing, /absolute path to the downloaded folder named brand/);
    assert.match(missing, /config set --brand-root/);
    assert.match(missing, /Do not ask the user to copy/);

    await mkdir(resolve(consumerRoot, "config"), { recursive: true });
    const stalePath = resolve(consumerRoot, "moved/brand");
    await writeFile(configFile, `${JSON.stringify({
      schemaVersion: "1.0.0",
      brandRoot: stalePath,
      updatedAt: "2026-07-22T00:00:00.000Z",
    }, null, 2)}\n`);

    const stale = context(run({ cwd: consumerRoot, prompt: ">>brand checkgrow" }, environment));
    assert.match(stale, /configured brand folder does not exist/);
    assert.match(stale, new RegExp(stalePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(stale, /Stop branded work until configuration reports status ready/);
  } finally {
    await rm(consumerRoot, { recursive: true, force: true });
  }
});
