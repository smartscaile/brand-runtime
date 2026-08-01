import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

test("reports runtime version and promotes explicit brand rules independently", async () => {
  const fixture = await createBrandFixture();
  try {
    const initial = output(run(fixture.projectRoot, "validate", ["--brand", "checkgrow"]));
    assert.match(initial.runtimeVersion, /^0\.4\.1(?:\+codex\.[a-z0-9.-]+)?$/);
    assert.equal(initial.brandVersion, "0.5.3");
    assert.equal(initial.rulesSchemaVersion, "1.0.0");
    assert.equal(initial.rulesRevision, 0);
    assert.equal(initial.valid, true);

    const learnArgs = [
      "--scope", "brand",
      "--kind", "rule",
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
    assert.deepEqual(documentContext.precedence, [
      "active brand rules",
      "immutable Brand Pack",
      "universal design foundation",
      "compatible project direction and rules",
    ]);
    assert.equal(documentContext.projectDesignDirection, "docs/design/design-direction.md");
    assert.equal(documentContext.projectKnowledge.root, fixture.projectRoot);
    assert.deepEqual(documentContext.projectKnowledge.rules, []);
    assert.deepEqual(documentContext.projectKnowledge.learnings, []);
    assert.deepEqual(documentContext.projectKnowledge.patterns, []);
    assert.equal(documentContext.clientRules.length, 1);
    assert.equal(documentContext.clientRules[0].id, "editorial.no-rounded-left-rule");
    assert.deepEqual(documentContext.brandRules, documentContext.clientRules);

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

test("stores explicit rules, learnings, and patterns as project-local Markdown", async () => {
  const fixture = await createBrandFixture();
  try {
    const references = resolve(fixture.projectRoot, "docs/design/references");
    await mkdir(references, { recursive: true });
    await writeFile(resolve(references, "editorial-hero.png"), "fixture");

    const patternArgs = [
      "--scope", "project",
      "--kind", "pattern",
      "--brand", "checkgrow",
      "--id", "site.editorial-hero",
      "--title", "Editorial hero",
      "--surface", "site",
      "--instruction", "Use an asymmetric editorial hero with one dominant property image and a compact qualification action.",
      "--feedback", "The client approved this structure as the strongest direction for the funnel.",
      "--rationale", "The composition establishes hierarchy without relying on repetitive cards.",
      "--use-when", "The opening must establish property value and qualification intent together.",
      "--avoid-when", "The page lacks a strong approved image or the primary task is dense product operation.",
      "--evidence", "docs/design/references/editorial-hero.png",
    ];
    const pattern = output(run(fixture.projectRoot, "learn", patternArgs));
    assert.equal(pattern.scope, "project");
    assert.equal(pattern.kind, "pattern");
    assert.equal(pattern.changed, true);
    assert.equal(pattern.relativePath, "docs/design/patterns/site.editorial-hero.md");

    const patternDocument = await readFile(resolve(fixture.projectRoot, pattern.relativePath), "utf8");
    assert.match(patternDocument, /kind: "pattern"/);
    assert.match(patternDocument, /brand: "checkgrow"/);
    assert.match(patternDocument, /## Use when/);
    assert.match(patternDocument, /## Avoid when/);
    assert.match(patternDocument, /docs\/design\/references\/editorial-hero\.png/);

    const duplicate = output(run(fixture.projectRoot, "learn", patternArgs));
    assert.equal(duplicate.changed, false);

    const projectRule = output(run(fixture.projectRoot, "learn", [
      "--scope", "project",
      "--kind", "rule",
      "--brand", "checkgrow",
      "--id", "site.no-generic-card-grid",
      "--surface", "site",
      "--instruction", "Do not repeat a generic card grid across funnel sections.",
      "--feedback", "The repeated card anatomy made this project feel generic.",
    ]));
    assert.equal(projectRule.relativePath, "docs/design/rules/site.no-generic-card-grid.md");

    const learning = output(run(fixture.projectRoot, "learn", [
      "--scope", "project",
      "--kind", "learning",
      "--brand", "checkgrow",
      "--id", "site.image-hierarchy",
      "--surface", "site",
      "--instruction", "A single large property image creates stronger hierarchy than several equal thumbnails.",
      "--feedback", "The client preferred the art-directed composition during review.",
    ]));
    assert.equal(learning.relativePath, "docs/design/learnings/site.image-hierarchy.md");

    await assert.rejects(access(resolve(fixture.brandRoot, "brand.rules.json")));

    const projectContext = output(run(fixture.projectRoot, "context", [
      "--brand", "checkgrow",
      "--surface", "site",
    ]));
    assert.deepEqual(projectContext.projectKnowledge.rules, ["docs/design/rules/site.no-generic-card-grid.md"]);
    assert.deepEqual(projectContext.projectKnowledge.learnings, ["docs/design/learnings/site.image-hierarchy.md"]);
    assert.deepEqual(projectContext.projectKnowledge.patterns, ["docs/design/patterns/site.editorial-hero.md"]);
  } finally {
    await rm(fixture.projectRoot, { recursive: true, force: true });
  }
});

test("supports provisional project context and learning without a Brand Pack", async () => {
  const projectRoot = await mkdtemp(resolve(tmpdir(), "brand-runtime-pending-"));
  try {
    const pendingContext = output(run(projectRoot, "context", [
      "--mode", "brand-pending",
      "--surface", "site",
    ]));
    assert.equal(pendingContext.valid, true);
    assert.equal(pendingContext.mode, "brand-pending");
    assert.equal(pendingContext.brandStatus, "pending");
    assert.equal(pendingContext.identityClaim, "none");
    assert.equal(pendingContext.provisional, true);
    assert.equal(pendingContext.slug, null);
    assert.equal(pendingContext.brandVersion, null);
    assert.equal(pendingContext.projectKnowledge.root, projectRoot);
    assert.deepEqual(pendingContext.brandRules, []);
    assert.equal(pendingContext.identity, null);

    const learning = output(run(projectRoot, "learn", [
      "--scope", "project",
      "--mode", "brand-pending",
      "--kind", "learning",
      "--id", "site.provisional-hierarchy",
      "--surface", "site",
      "--instruction", "Keep one dominant property image and one primary qualification action.",
      "--feedback", "The provisional direction was approved for this MVP while identity remains pending.",
    ]));
    assert.equal(learning.mode, "brand-pending");
    assert.equal(learning.slug, null);
    assert.equal(learning.brandVersion, null);

    const document = await readFile(resolve(projectRoot, learning.relativePath), "utf8");
    assert.match(document, /mode: "brand-pending"/);
    assert.match(document, /brand: null/);
    assert.match(document, /brand_version: null/);

    const mixedMode = run(projectRoot, "context", [
      "--mode", "brand-pending",
      "--brand", "another-client",
      "--surface", "site",
    ]);
    assert.equal(mixedMode.status, 1);
    assert.match(mixedMode.stderr, /Do not use --brand/);

    const invalidPromotion = run(projectRoot, "learn", [
      "--scope", "brand",
      "--mode", "brand-pending",
      "--kind", "rule",
    ]);
    assert.equal(invalidPromotion.status, 1);
    assert.match(invalidPromotion.stderr, /cannot be promoted/);
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
});

test("requires explicit learning scope and complete pattern conditions", async () => {
  const fixture = await createBrandFixture();
  try {
    const missingScope = run(fixture.projectRoot, "learn", [
      "--kind", "learning",
      "--brand", "checkgrow",
      "--id", "site.example",
      "--instruction", "Example.",
      "--feedback", "Example.",
    ]);
    assert.equal(missingScope.status, 1);
    assert.match(missingScope.stderr, /--scope/);

    const incompletePattern = run(fixture.projectRoot, "learn", [
      "--scope", "project",
      "--kind", "pattern",
      "--brand", "checkgrow",
      "--id", "site.example",
      "--instruction", "Example.",
      "--feedback", "Example.",
    ]);
    assert.equal(incompletePattern.status, 1);
    assert.match(incompletePattern.stderr, /--use-when and --avoid-when/);

    const invalidPromotion = run(fixture.projectRoot, "learn", [
      "--scope", "brand",
      "--kind", "pattern",
      "--brand", "checkgrow",
    ]);
    assert.equal(invalidPromotion.status, 1);
    assert.match(invalidPromotion.stderr, /Only a rule can be promoted/);

    const unsafeEvidence = run(fixture.projectRoot, "learn", [
      "--scope", "project",
      "--kind", "learning",
      "--brand", "checkgrow",
      "--id", "site.unsafe",
      "--instruction", "Example.",
      "--feedback", "Example.",
      "--evidence", "../outside.png",
    ]);
    assert.equal(unsafeEvidence.status, 1);
    assert.match(unsafeEvidence.stderr, /docs\/design\/references/);
  } finally {
    await rm(fixture.projectRoot, { recursive: true, force: true });
  }
});

test("rejects an invalid brand-owned rules layer", async () => {
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

    const projectContext = output(runFrom(consumerRoot, "context", [
      "--brand", "checkgrow",
      "--surface", "site",
      "--project-root", consumerRoot,
    ], environment));
    assert.equal(projectContext.slug, "checkgrow");
    assert.equal(projectContext.projectKnowledge.root, consumerRoot);
    assert.equal(projectContext.projectKnowledge.designDirection.present, false);

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
