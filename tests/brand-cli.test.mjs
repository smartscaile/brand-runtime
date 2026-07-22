import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

const cli = resolve(import.meta.dirname, "../plugins/brand-runtime/skills/brand/scripts/brand.ts");

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function run(projectRoot, command, extra = []) {
  const result = spawnSync(process.execPath, [
    "--experimental-strip-types",
    cli,
    command,
    ...extra,
    "--project-root",
    projectRoot,
  ], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  return result;
}

function runFrom(cwd, command, extra = [], environment = {}) {
  return spawnSync(process.execPath, [
    "--experimental-strip-types",
    cli,
    command,
    ...extra,
  ], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...environment },
  });
}

function output(result) {
  assert.equal(result.status, 0, result.stderr || `CLI exited with ${result.status}`);
  return JSON.parse(result.stdout);
}

async function createBrandFixture() {
  const projectRoot = await mkdtemp(resolve(tmpdir(), "brand-runtime-cli-"));
  const brandRoot = resolve(projectRoot, "brand/checkgrow");
  await mkdir(brandRoot, { recursive: true });

  const sourceBody = `${JSON.stringify({
    slug: "checkgrow",
    brandVersion: "0.5.3",
    schemaVersion: "1.0.0",
    identity: { name: "Checkgrow" },
    voice: { language: "en" },
    surfaces: {
      site: ["Use the declared site system."],
      document: ["Use the declared editorial system."],
    },
  }, null, 2)}\n`;
  const sourceHash = hash(sourceBody);
  const tokensBody = `${JSON.stringify({
    slug: "checkgrow",
    brandVersion: "0.5.3",
    sourceHash,
    colors: {},
    typography: {},
    layout: {},
    motion: {},
    assets: {},
  }, null, 2)}\n`;
  const guidelinesBody = "# Checkgrow Brand Guidelines\n";

  await writeFile(resolve(brandRoot, "brand.source.json"), sourceBody);
  await writeFile(resolve(brandRoot, "tokens.json"), tokensBody);
  await writeFile(resolve(brandRoot, "brand-guidelines.md"), guidelinesBody);
  await writeFile(resolve(brandRoot, "build-manifest.json"), `${JSON.stringify({
    slug: "checkgrow",
    brandVersion: "0.5.3",
    sourceHash,
    artifacts: {
      "tokens.json": hash(tokensBody),
      "brand-guidelines.md": hash(guidelinesBody),
    },
    assetHashes: {},
  }, null, 2)}\n`);

  return { projectRoot, brandRoot };
}

test("reports runtime version and persists explicit client rules independently", async () => {
  const fixture = await createBrandFixture();
  try {
    const initial = output(run(fixture.projectRoot, "validate", ["--brand", "checkgrow"]));
    assert.equal(initial.runtimeVersion, "0.2.1");
    assert.equal(initial.brandVersion, "0.5.3");
    assert.equal(initial.rulesSchemaVersion, "1.0.0");
    assert.equal(initial.rulesRevision, 0);
    assert.equal(initial.valid, true);

    const learnArgs = [
      "--brand", "checkgrow",
      "--id", "editorial.no-rounded-left-rule",
      "--surface", "document",
      "--severity", "critical",
      "--instruction", "Do not use a rounded surface with a colored left rule as an automatic highlight treatment.",
      "--feedback", "The client rejected the rounded left-rule treatment as generic AI styling.",
    ];
    const learned = output(run(fixture.projectRoot, "learn", learnArgs));
    assert.equal(learned.changed, true);
    assert.equal(learned.rulesRevision, 1);

    const persisted = JSON.parse(await readFile(resolve(fixture.brandRoot, "brand.rules.json"), "utf8"));
    assert.equal(persisted.slug, "checkgrow");
    assert.equal(persisted.revision, 1);
    assert.equal(persisted.rules[0].id, "editorial.no-rounded-left-rule");

    const documentContext = output(run(fixture.projectRoot, "context", [
      "--brand", "checkgrow",
      "--surface", "document",
    ]));
    assert.equal(documentContext.clientRules.length, 1);
    assert.equal(documentContext.clientRules[0].id, "editorial.no-rounded-left-rule");

    const siteContext = output(run(fixture.projectRoot, "context", [
      "--brand", "checkgrow",
      "--surface", "site",
    ]));
    assert.deepEqual(siteContext.clientRules, []);

    const duplicate = output(run(fixture.projectRoot, "learn", learnArgs));
    assert.equal(duplicate.changed, false);
    assert.equal(duplicate.rulesRevision, 1);

    const deprecated = output(run(fixture.projectRoot, "learn", [
      ...learnArgs,
      "--status", "deprecated",
    ]));
    assert.equal(deprecated.changed, true);
    assert.equal(deprecated.rulesRevision, 2);

    const contextAfterDeprecation = output(run(fixture.projectRoot, "context", [
      "--brand", "checkgrow",
      "--surface", "document",
    ]));
    assert.deepEqual(contextAfterDeprecation.clientRules, []);
  } finally {
    await rm(fixture.projectRoot, { recursive: true, force: true });
  }
});

test("rejects an invalid client-owned rules layer", async () => {
  const fixture = await createBrandFixture();
  try {
    await writeFile(resolve(fixture.brandRoot, "brand.rules.json"), `${JSON.stringify({
      schemaVersion: "1.0.0",
      slug: "another-brand",
      revision: 0,
      updatedAt: "not-a-date",
      rules: [],
    }, null, 2)}\n`);

    const result = run(fixture.projectRoot, "validate", ["--brand", "checkgrow"]);
    assert.equal(result.status, 1);
    const validation = JSON.parse(result.stdout);
    assert.equal(validation.valid, false);
    assert.ok(validation.errors.some((error) => error.includes("slug differs")));
    assert.ok(validation.errors.some((error) => error.includes("revision must be a positive integer")));
  } finally {
    await rm(fixture.projectRoot, { recursive: true, force: true });
  }
});

test("persists the brand folder once and discovers sibling Brand Packs dynamically", async () => {
  const fixture = await createBrandFixture();
  const consumerRoot = await mkdtemp(resolve(tmpdir(), "brand-runtime-config-"));
  try {
    const brandRoot = resolve(fixture.projectRoot, "brand");
    const configFile = resolve(consumerRoot, "config/brand-runtime.json");
    const environment = {
      BRAND_RUNTIME_CONFIG: configFile,
      BRAND_RUNTIME_BRAND_ROOT: "",
    };
    const configured = output(runFrom(consumerRoot, "config", [
      "set",
      "--brand-root", brandRoot,
    ], environment));
    assert.equal(configured.status, "ready");
    assert.equal(configured.brandRoot, brandRoot);
    assert.deepEqual(configured.brands, ["checkgrow"]);
    const savedConfig = await readFile(configFile, "utf8");
    assert.deepEqual(Object.keys(JSON.parse(savedConfig)), ["schemaVersion", "brandRoot", "updatedAt"]);

    const secondPack = resolve(brandRoot, "wascen");
    await mkdir(secondPack, { recursive: true });
    await writeFile(resolve(secondPack, "brand.source.json"), `${JSON.stringify({
      slug: "wascen",
      brandVersion: "1.0.0",
    }, null, 2)}\n`);

    const shown = output(runFrom(consumerRoot, "config", ["show"], environment));
    assert.equal(shown.source, "user-config");
    assert.deepEqual(shown.brands, ["checkgrow", "wascen"]);
    assert.equal(await readFile(configFile, "utf8"), savedConfig);

    const selected = output(runFrom(consumerRoot, "status", ["--brand", "checkgrow"], environment));
    assert.equal(selected.slug, "checkgrow");
    assert.equal(selected.brandRoot, brandRoot);
    assert.equal(selected.brandRootSource, "user-config");
    assert.deepEqual(selected.availableBrands, ["checkgrow", "wascen"]);

    const ambiguous = runFrom(consumerRoot, "status", [], environment);
    assert.equal(ambiguous.status, 1);
    assert.match(ambiguous.stderr, /multiple Brand Packs/);
    assert.match(ambiguous.stderr, /checkgrow, wascen/);

    const individualPack = runFrom(consumerRoot, "config", [
      "set",
      "--brand-root", fixture.brandRoot,
    ], environment);
    assert.equal(individualPack.status, 1);
    assert.match(individualPack.stderr, /folder named brand, not to an individual Brand Pack/);
  } finally {
    await rm(fixture.projectRoot, { recursive: true, force: true });
    await rm(consumerRoot, { recursive: true, force: true });
  }
});
