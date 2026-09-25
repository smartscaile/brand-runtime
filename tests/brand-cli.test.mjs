import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { access, cp, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import * as rootConfig from "../plugins/brand-runtime/scripts/brand-root-config.mjs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import test from "node:test";

const cli = resolve(import.meta.dirname, "../plugins/brand-runtime/skills/brand/scripts/brand.ts");
const runtimeVersion = JSON.parse(await readFile(
  resolve(import.meta.dirname, "../plugins/brand-runtime/.codex-plugin/plugin.json"),
  "utf8",
)).version;

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

async function createBrandFixture(slug = "checkgrow") {
  const projectRoot = await mkdtemp(resolve(tmpdir(), "brand-runtime-cli-"));
  const brandRoot = resolve(projectRoot, "brand", slug);
  const brandName = slug === "checkgrow" ? "Checkgrow" : slug;
  await mkdir(brandRoot, { recursive: true });

  const sourceBody = `${JSON.stringify({
    slug,
    brandVersion: "0.5.3",
    schemaVersion: "1.0.0",
    identity: { name: brandName },
    voice: { language: "en" },
    surfaces: {
      site: ["Use the declared site system."],
      document: ["Use the declared editorial system."],
    },
  }, null, 2)}\n`;
  const sourceHash = hash(sourceBody);
  const tokensBody = `${JSON.stringify({
    slug,
    brandVersion: "0.5.3",
    sourceHash,
    colors: {},
    typography: {},
    layout: {},
    motion: {},
    assets: {},
  }, null, 2)}\n`;
  const guidelinesBody = `# ${brandName} Brand Guidelines\n`;

  await writeFile(resolve(brandRoot, "brand.source.json"), sourceBody);
  await writeFile(resolve(brandRoot, "tokens.json"), tokensBody);
  await writeFile(resolve(brandRoot, "brand-guidelines.md"), guidelinesBody);
  await writeFile(resolve(brandRoot, "build-manifest.json"), `${JSON.stringify({
    slug,
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
    assert.equal(initial.runtimeVersion, runtimeVersion);
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
      "official Brand Pack identity and explicit constraints",
      "compatible project direction and rules",
      "Brand Pack foundation defaults",
      "universal design foundation",
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

test("context finds existing project design entrypoints without requiring a new knowledge tree", async () => {
  const fixture = await createBrandFixture("local-ui");
  try {
    await mkdir(resolve(fixture.projectRoot, "design"));
    const sources = {
      "AGENTS.md": "Use the project's existing UI.\n",
      "project.json": JSON.stringify({ source_of_truth: { patterns: "design/patterns.json" } }),
      "design/patterns.json": JSON.stringify({ patterns: [
        { id: "existing-control", status: "approved" },
        { id: "new-illustration", status: "rejected" },
      ] }),
      "spine.json": JSON.stringify({ approved: false }),
    };
    for (const [path, content] of Object.entries(sources)) await writeFile(resolve(fixture.projectRoot, path), content);
    for (const mode of ["brand-pack", "brand-pending"]) {
      const args = ["--mode", mode, "--surface", "site"];
      if (mode === "brand-pack") args.push("--brand", "local-ui");
      const data = output(run(fixture.projectRoot, "context", args));
      assert.deepEqual(data.projectKnowledge.existingSources, Object.keys(sources));
      assert.equal(data.projectKnowledge.discoveryScope, "entrypoints-only");
      assert.deepEqual(data.projectKnowledge.patterns, [], "an empty default folder does not mean no project UI exists");
      assert.equal(data.projectKnowledge.approved, undefined, "discovery must not manufacture approval");
      assert.equal(JSON.stringify(data).includes("new-illustration"), false, "return paths, not unreviewed project contents");
    }
    for (const [path, content] of Object.entries(sources)) assert.equal(await readFile(resolve(fixture.projectRoot, path), "utf8"), content);
    await assert.rejects(access(resolve(fixture.projectRoot, "docs/design")));
  } finally {
    await rm(fixture.projectRoot, { recursive: true, force: true });
  }
});

test("existing design entrypoints exclude symlinks and non-files", async () => {
  const root = await realpath(await mkdtemp(resolve(tmpdir(), "brand-local-sources-")));
  try {
    const projectRoot = resolve(root, "project");
    const external = resolve(root, "external");
    await mkdir(projectRoot);
    await mkdir(external);
    await writeFile(resolve(external, "patterns.json"), "private external content");
    await writeFile(resolve(external, "agents.md"), "external instructions");
    await symlink(external, resolve(projectRoot, "design"));
    await symlink(resolve(external, "agents.md"), resolve(projectRoot, "AGENTS.md"));
    await mkdir(resolve(projectRoot, "project.json"));
    const data = output(run(projectRoot, "context", ["--mode", "brand-pending", "--surface", "product"]));
    assert.deepEqual(data.projectKnowledge.existingSources, []);
    assert.equal(JSON.stringify(data).includes("private external content"), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("context delivers existing-UI inheritance and local composition freedom rather than a frozen template", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "brand-composition-freedom-"));
  try {
    const data = output(run(root, "context", ["--mode", "brand-pending", "--surface", "product"]));
    const foundation = data.designMethod.foundation.content;
    assert.match(foundation, /## Base existente e liberdade de composição/);
    for (const strategy of ["Reutilizar", "Evoluir", "Compor"]) assert.ok(foundation.includes(`**${strategy}**`));
    assert.match(foundation, /rejeitado não vira base aprovada/);
    assert.match(foundation, /ausência de um componente no Brand Pack não proíbe/);
    assert.match(foundation, /não autoriza violar uma regra explícita/);
    assert.match(foundation, /sem criar um novo formulário/);
    const skill = await readFile(resolve(import.meta.dirname, "../plugins/brand-runtime/skills/brand/SKILL.md"), "utf8");
    assert.match(skill, /projectKnowledge\.existingSources/);
    assert.match(skill, /não são um inventário completo/);
    const learning = await readFile(resolve(import.meta.dirname, "../plugins/brand-runtime/skills/brand/references/project-learning.md"), "utf8");
    assert.match(learning, /Preserve o registro canônico existente/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("concrete project direction precedes universal guidance without outranking official identity", async () => {
  const fixture = await createBrandFixture("local-direction");
  try {
    const official = output(run(fixture.projectRoot, "context", ["--brand", "local-direction", "--surface", "site"]));
    assert.deepEqual(official.precedence, [
      "active brand rules", "official Brand Pack identity and explicit constraints",
      "compatible project direction and rules", "Brand Pack foundation defaults", "universal design foundation",
    ]);
    assert.deepEqual(official.identity, { name: "local-direction" });
    const pending = output(run(fixture.projectRoot, "context", ["--mode", "brand-pending", "--surface", "product"]));
    assert.deepEqual(pending.precedence, [
      "explicit user and project constraints",
      "compatible project-owned provisional direction and rules", "universal design foundation",
    ]);
    assert.equal(pending.identity, null);
  } finally {
    await rm(fixture.projectRoot, { recursive: true, force: true });
  }
});

test("context separates identity, foundation defaults and project-owned UI across surfaces", async () => {
  const fixture = await createBrandFixture("foundation-fixture");
  try {
    for (const mode of ["brand-pack", "brand-pending"]) {
      for (const surface of ["site", "product", "presentation", "document"]) {
        const result = output(run(fixture.projectRoot, "context", [
          "--mode", mode, "--surface", surface,
          ...(mode === "brand-pack" ? ["--brand", "foundation-fixture"] : []),
        ]));
        assert.deepEqual(result.designAuthority, {
          identityOwner: mode === "brand-pack" ? "brand-pack" : "project-provisional",
          uiOwner: "project",
          foundationDefaults: ["typography.scale", "layout", "motion.durations", "motion.easings"],
          themeSelection: "project-from-declared-palette",
          examples: "reference-only",
          explicitConstraints: "binding",
          localExtensions: "allowed-without-changing-identity",
        });
        assert.match(result.designMethod.foundation.content, /## Identidade, fundação e UI do projeto/);
        assert.match(result.designMethod.foundation.content, /restrição explícita continua obrigatória/);
        if (mode === "brand-pack" && surface === "site") {
          assert.deepEqual(result.rules, ["Use the declared site system."]);
          assert.deepEqual(result.identity, { name: "foundation-fixture" });
        }
        if (mode === "brand-pending") assert.equal(result.identityClaim, "none");
      }
    }
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

// Discovery fixtures contain markers only; full pack validation remains a separate gate.
async function rootConfigFixture(t) {
  const cwd = await realpath(await mkdtemp(resolve(tmpdir(), "brand-root-config-")));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const configFile = resolve(cwd, "config.json");
  const env = { BRAND_RUNTIME_CONFIG: configFile, BRAND_RUNTIME_BRAND_ROOT: "" };
  const library = async (name, slugs) => {
    const root = resolve(cwd, name, "brand");
    await mkdir(root, { recursive: true });
    for (const slug of slugs) {
      const pack = resolve(root, slug);
      await mkdir(pack, { recursive: true });
      await writeFile(resolve(pack, "brand.source.json"), JSON.stringify({ slug, brandVersion: "1.0.0" }));
    }
    return root;
  };
  const save = (document) => writeFile(configFile, JSON.stringify({
    schemaVersion: "1.0.0", updatedAt: "2026-01-01T00:00:00.000Z", ...document,
  }));
  return { cwd, configFile, env, library, save };
}

test("root config reads legacy schema and dynamically unions deduplicated additional roots", async (t) => {
  const fixture = await rootConfigFixture(t);
  const { env, library, save, configFile } = fixture;
  const first = await library("first", ["alpha"]);
  await save({ brandRoot: first });
  const legacy = rootConfig.readBrandRootConfig({ env });
  assert.equal(legacy.ok, true);
  assert.equal(legacy.brandRoot, first);
  assert.deepEqual(legacy.brandRoots, [first]);
  assert.deepEqual(legacy.brands, ["alpha"]);

  const second = await library("second", ["beta"]);
  await save({ brandRoot: first, additionalBrandRoots: [second, first, `${second}/.`] });
  const original = await readFile(configFile, "utf8");
  const multiple = rootConfig.readBrandRootConfig({ env });
  assert.equal(multiple.ok, true);
  assert.equal(multiple.brandRoot, first);
  assert.deepEqual(multiple.brandRoots, [first, second]);
  assert.deepEqual(multiple.brands, ["alpha", "beta"]);
  await library("second", ["gamma"]);
  assert.deepEqual(rootConfig.readBrandRootConfig({ env }).brands, ["alpha", "beta", "gamma"]);
  assert.equal(await readFile(configFile, "utf8"), original);
});

test("root config rejects malformed additional roots and invalid folders without fallback", async (t) => {
  const { env, library, save, cwd } = await rootConfigFixture(t);
  const first = await library("first", ["alpha"]);
  const empty = await library("empty", []);
  const file = resolve(cwd, "file/brand");
  await mkdir(resolve(cwd, "file"));
  await writeFile(file, "not a directory");
  const wrongName = resolve(cwd, "wrong-name");
  await mkdir(wrongName);
  for (const [label, additionalBrandRoots, status] of [
    ["null", null, "invalid-config"],
    ["string", first, "invalid-config"],
    ["object", {}, "invalid-config"],
    ["number element", [42], "invalid-config"],
    ["null element", [null], "invalid-config"],
    ["blank", [""], "missing"],
    ["relative", ["brand"], "invalid"],
    ["missing", [resolve(cwd, "missing/brand")], "stale"],
    ["empty", [empty], "empty"],
    ["file", [file], "invalid"],
    ["individual pack", [resolve(first, "alpha")], "invalid"],
    ["wrong name", [wrongName], "invalid"],
  ]) {
    await t.test(label, async () => {
      await save({ brandRoot: first, additionalBrandRoots });
      const result = rootConfig.readBrandRootConfig({ env });
      assert.equal(result.ok, false);
      assert.equal(result.status, status);
      assert.match(result.reason, /additionalBrandRoots/);
      assert.equal(rootConfig.resolveBrandRoot({ cwd, env, brand: "alpha" }).ok, false);
    });
  }
  await save({ brandRoot: "brand", additionalBrandRoots: [first] });
  const invalidPrimary = rootConfig.readBrandRootConfig({ env });
  assert.equal(invalidPrimary.ok, false);
  assert.equal(invalidPrimary.status, "invalid");
  assert.match(invalidPrimary.reason, /absolute/);
});

test("root config add initializes and preserves earlier roots while set replaces the selection", async (t) => {
  const { env, library, configFile } = await rootConfigFixture(t);
  const first = await library("first", ["alpha"]);
  const second = await library("second", ["beta"]);
  const third = await library("third", ["gamma"]);
  assert.equal(typeof rootConfig.addBrandRootConfig, "function");
  const initialized = rootConfig.addBrandRootConfig(first, { env });
  assert.equal(initialized.ok, true);
  assert.deepEqual(initialized.brandRoots, [first]);
  assert.equal(initialized.changed, true);
  assert.deepEqual(Object.keys(JSON.parse(await readFile(configFile, "utf8"))), ["schemaVersion", "brandRoot", "updatedAt"]);

  const added = rootConfig.addBrandRootConfig(second, { env });
  assert.equal(added.ok, true);
  assert.equal(added.changed, true);
  assert.equal(added.brandRoot, first);
  assert.deepEqual(added.brandRoots, [first, second]);
  assert.deepEqual(added.brands, ["alpha", "beta"]);
  rootConfig.addBrandRootConfig(third, { env });
  const persisted = JSON.parse(await readFile(configFile, "utf8"));
  assert.equal(persisted.schemaVersion, "1.0.0");
  assert.equal(persisted.brandRoot, first);
  assert.deepEqual(persisted.additionalBrandRoots, [second, third]);
  assert.deepEqual(Object.keys(persisted).sort(), ["additionalBrandRoots", "brandRoot", "schemaVersion", "updatedAt"]);
  assert.deepEqual(rootConfig.readBrandRootConfig({ env }).brandRoots, [first, second, third]);

  const replaced = rootConfig.writeBrandRootConfig(second, { env });
  assert.deepEqual(replaced.brandRoots, [second]);
  assert.equal(replaced.brandRoot, second);
  assert.deepEqual(rootConfig.readBrandRootConfig({ env }).brands, ["beta"]);
  assert.equal(Object.hasOwn(JSON.parse(await readFile(configFile, "utf8")), "additionalBrandRoots"), false);
});

test("root config add is idempotent without timestamp or file rewrites", async (t) => {
  const { stat, utimes } = await import("node:fs/promises");
  const { env, library, save, configFile } = await rootConfigFixture(t);
  const first = await library("first", ["alpha"]);
  const second = await library("second", ["beta"]);
  await save({ brandRoot: first, additionalBrandRoots: [second] });
  await utimes(configFile, new Date("2026-01-01T00:00:00.000Z"), new Date("2026-01-01T00:00:00.000Z"));
  const original = await readFile(configFile, "utf8");
  const before = await stat(configFile);
  await library("second", ["gamma"]);
  for (const root of [first, second, `${second}/.`]) {
    const result = rootConfig.addBrandRootConfig(root, { env });
    assert.equal(result.changed, false);
    assert.equal(result.updatedAt, "2026-01-01T00:00:00.000Z");
    assert.deepEqual(result.brandRoots, [first, second]);
    assert.deepEqual(result.brands, ["alpha", "beta", "gamma"]);
    assert.equal(await readFile(configFile, "utf8"), original);
    const after = await stat(configFile);
    assert.equal(after.mtimeMs, before.mtimeMs);
    assert.equal(after.ino, before.ino);
  }
});

test("root config add rejects invalid input and never repairs broken saved configuration", async (t) => {
  const { env, library, save, configFile, cwd } = await rootConfigFixture(t);
  const first = await library("first", ["alpha"]);
  const second = await library("second", ["beta"]);
  const empty = await library("empty", []);
  await save({ brandRoot: first });
  const original = await readFile(configFile, "utf8");
  for (const value of ["brand", "", null, 42, empty, resolve(first, "alpha"), resolve(cwd, "missing/brand")]) {
    assert.throws(() => rootConfig.addBrandRootConfig(value, { env }));
    assert.equal(await readFile(configFile, "utf8"), original);
  }
  for (const document of [
    { brandRoot: first, schemaVersion: "unsupported" },
    { brandRoot: first, additionalBrandRoots: null },
    { brandRoot: resolve(cwd, "missing/brand") },
    { brandRoot: empty },
  ]) {
    await save(document);
    const broken = await readFile(configFile, "utf8");
    assert.throws(() => rootConfig.addBrandRootConfig(second, { env }), /config|folder/);
    assert.equal(await readFile(configFile, "utf8"), broken);
  }
  await writeFile(configFile, "{broken-json");
  assert.throws(() => rootConfig.addBrandRootConfig(second, { env }), /not valid JSON/);
  assert.equal(await readFile(configFile, "utf8"), "{broken-json");
});

test("root config resolves the requested global slug without auto-selecting an identity", async (t) => {
  const { cwd, env, library, save } = await rootConfigFixture(t);
  const first = await library("first", ["alpha"]);
  const second = await library("second", ["beta"]);
  await save({ brandRoot: first, additionalBrandRoots: [second] });
  for (const [brand, expected] of [["alpha", first], ["beta", second]]) {
    const result = rootConfig.resolveBrandRoot({ cwd, env, brand });
    assert.equal(result.ok, true);
    assert.equal(result.brandRoot, expected);
    assert.equal(result.configuredBrandRoot, first);
    assert.equal(result.source, "user-config");
    assert.deepEqual(result.brandRoots, [first, second]);
    assert.deepEqual(result.brands, ["alpha", "beta"]);
  }
  const discovery = rootConfig.resolveBrandRoot({ cwd, env });
  assert.equal(discovery.brandRoot, first);
  assert.equal(Object.hasOwn(discovery, "brand"), false);
  assert.equal(Object.hasOwn(discovery, "slug"), false);
  const missing = rootConfig.resolveBrandRoot({ cwd, env, brand: "missing" });
  assert.equal(missing.ok, false);
  assert.equal(missing.status, "brand-not-found");
  assert.match(missing.reason, /missing/);
});

test("root config reports duplicate global slugs and never selects the first copy", async (t) => {
  const { cwd, env, library, save, configFile } = await rootConfigFixture(t);
  const first = await library("first", ["shared", "alpha"]);
  const second = await library("second", ["shared", "beta"]);
  await save({ brandRoot: first });
  const added = rootConfig.addBrandRootConfig(second, { env });
  assert.equal(added.ok, false);
  assert.equal(added.status, "ambiguous");
  assert.equal(added.changed, true);
  for (const result of [rootConfig.readBrandRootConfig({ env }), rootConfig.resolveBrandRoot({ cwd, env }), rootConfig.resolveBrandRoot({ cwd, env, brand: "shared" })]) {
    assert.equal(result.ok, false);
    assert.equal(result.status, "ambiguous");
    assert.deepEqual(result.brands, ["alpha", "beta", "shared"]);
    assert.deepEqual(result.duplicateBrands, [{ slug: "shared", brandRoots: [first, second] }]);
    assert.match(result.reason, /shared/);
    assert.ok(result.reason.includes(first));
    assert.ok(result.reason.includes(second));
  }
  const unique = rootConfig.resolveBrandRoot({ cwd, env, brand: "beta" });
  assert.equal(unique.ok, true);
  assert.equal(unique.status, "ready");
  assert.equal(unique.reason, undefined);
  assert.equal(unique.brandRoot, second);
  const original = await readFile(configFile, "utf8");
  assert.equal(rootConfig.addBrandRootConfig(second, { env }).changed, false);
  assert.equal(await readFile(configFile, "utf8"), original);
  await save({ brandRoot: first, additionalBrandRoots: [first, `${first}/.`] });
  const deduplicated = rootConfig.readBrandRootConfig({ env });
  assert.equal(deduplicated.ok, true);
  assert.deepEqual(deduplicated.duplicateBrands, []);
});

test("root config skips an implicit project root only when the requested slug is absent", async (t) => {
  const { cwd, env, library, save } = await rootConfigFixture(t);
  const local = await library("", ["alpha"]);
  const global = await library("global", ["beta"]);
  await save({ brandRoot: global });
  const nested = resolve(cwd, "src/nested");
  await mkdir(nested, { recursive: true });
  const fallback = rootConfig.resolveBrandRoot({ cwd: nested, env, brand: "beta" });
  assert.equal(fallback.ok, true);
  assert.equal(fallback.brandRoot, global);
  assert.equal(fallback.source, "user-config");
  assert.equal(rootConfig.resolveBrandRoot({ cwd: nested, env }).brandRoot, local);
  assert.equal(rootConfig.resolveBrandRoot({ cwd: nested, env, brand: "alpha" }).source, "project");

  // An incomplete local candidate must remain local, not be replaced by the global namesake.
  await mkdir(resolve(local, "beta"));
  const incomplete = rootConfig.resolveBrandRoot({ cwd: nested, env, brand: "beta" });
  assert.equal(incomplete.brandRoot, local);
  assert.equal(incomplete.source, "project");
  assert.equal(incomplete.brands.includes("beta"), false);
  await writeFile(resolve(local, "beta/brand.source.json"), "{broken-json");
  const invalidPack = rootConfig.resolveBrandRoot({ cwd: nested, env, brand: "beta" });
  assert.equal(invalidPack.brandRoot, local);
  assert.equal(invalidPack.source, "project");
  const validation = runFrom(nested, "validate", ["--brand", "beta"], env);
  assert.equal(validation.status, 1);
  const report = JSON.parse(validation.stdout);
  assert.equal(report.valid, false);
  assert.equal(report.root, resolve(local, "beta"));
  assert.ok(report.errors.some(error => error.startsWith("Missing ")));
});

test("root config rejects malformed requested slugs before path resolution", async (t) => {
  const { cwd, env, library, save } = await rootConfigFixture(t);
  const first = await library("", ["alpha"]);
  await save({ brandRoot: first });
  for (const brand of ["../alpha", "ALPHA", "alpha/beta", "", " alpha ", null, 42]) {
    const result = rootConfig.resolveBrandRoot({ cwd, env, brand, explicitBrandRoot: first });
    assert.equal(result.ok, false);
    assert.equal(result.status, "invalid-brand");
    assert.match(result.reason, /slug/);
  }
});

test("root config preserves authoritative explicit and environment roots without identity fallback", async (t) => {
  const { cwd, env, library, save } = await rootConfigFixture(t);
  const local = await library("", ["alpha"]);
  const global = await library("global", ["beta"]);
  const explicitProject = await library("target", ["gamma"]);
  await save({ brandRoot: global });
  for (const [options, expected, source] of [
    [{ explicitBrandRoot: local }, local, "explicit"],
    [{ explicitProjectRoot: resolve(cwd, "target") }, explicitProject, "project-root"],
    [{ env: { ...env, BRAND_RUNTIME_BRAND_ROOT: local } }, local, "environment"],
    [{ explicitBrandRoot: local, env: { ...env, BRAND_RUNTIME_BRAND_ROOT: global } }, local, "explicit"],
    [{ explicitProjectRoot: resolve(cwd, "target"), env: { ...env, BRAND_RUNTIME_BRAND_ROOT: global } }, explicitProject, "project-root"],
  ]) {
    const result = rootConfig.resolveBrandRoot({ cwd, env, brand: "beta", ...options });
    assert.equal(result.brandRoot, expected);
    assert.equal(result.source, source);
    assert.equal(result.brands.includes("beta"), false);
  }
  const empty = await library("empty", []);
  for (const [path, status] of [[empty, "empty"], [resolve(cwd, "missing/brand"), "stale"]]) {
    for (const options of [{ explicitBrandRoot: path }, { env: { ...env, BRAND_RUNTIME_BRAND_ROOT: path } }]) {
      const result = rootConfig.resolveBrandRoot({ cwd, env, brand: "beta", ...options });
      assert.equal(result.ok, false);
      assert.equal(result.status, status);
      assert.equal(result.brandRoot, path);
    }
  }
});

test("root config does not hide broken local entries behind a global pack", async (t) => {
  const { cwd, env, library, save } = await rootConfigFixture(t);
  const local = await library("", ["alpha"]);
  const global = await library("global", ["beta"]);
  await save({ brandRoot: global });
  await symlink(resolve(cwd, "nonexistent-pack"), resolve(local, "beta"));
  const result = rootConfig.resolveBrandRoot({ cwd, env, brand: "beta" });
  assert.equal(result.brandRoot, local);
  assert.equal(result.source, "project");
  assert.equal(result.brands.includes("beta"), false);
});

test("root config detects global slug collisions even when one copy lacks its marker", async (t) => {
  const { cwd, env, library, save } = await rootConfigFixture(t);
  const first = await library("first", ["alpha"]);
  const second = await library("second", ["beta"]);
  await mkdir(resolve(first, "beta"));
  await save({ brandRoot: first, additionalBrandRoots: [second] });
  for (const result of [rootConfig.readBrandRootConfig({ env }), rootConfig.resolveBrandRoot({ cwd, env, brand: "beta" })]) {
    assert.equal(result.ok, false);
    assert.equal(result.status, "ambiguous");
    assert.deepEqual(result.duplicateBrands, [{ slug: "beta", brandRoots: [first, second] }]);
  }
});

test("CLI adds a global root and resolves explicit and positional brands without dropping siblings", async () => {
  const first = await createBrandFixture();
  const second = await createBrandFixture("second-brand");
  const consumer = await mkdtemp(resolve(tmpdir(), "brand-cli-library-"));
  const environment = { BRAND_RUNTIME_CONFIG: resolve(consumer, "config.json"), BRAND_RUNTIME_BRAND_ROOT: "" };
  try {
    output(runFrom(consumer, "config", ["set", "--brand-root", resolve(first.projectRoot, "brand")], environment));
    const added = output(runFrom(consumer, "config", ["add", "--brand-root", resolve(second.projectRoot, "brand")], environment));
    assert.equal(added.changed, true);
    assert.deepEqual(added.brands, ["checkgrow", "second-brand"]);
    const saved = await readFile(environment.BRAND_RUNTIME_CONFIG, "utf8");
    assert.equal(output(runFrom(consumer, "config", ["add", "--brand-root", resolve(second.projectRoot, "brand")], environment)).changed, false);
    assert.equal(await readFile(environment.BRAND_RUNTIME_CONFIG, "utf8"), saved);
    for (const [slug, fixture] of [["checkgrow", first], ["second-brand", second]]) {
      for (const selector of [["--brand", slug], [slug]]) {
        const selected = output(runFrom(consumer, "status", selector, environment));
        assert.equal(selected.slug, slug);
        assert.equal(output(runFrom(consumer, "validate", selector, environment)).valid, true);
        assert.equal(selected.brandRoot, resolve(fixture.projectRoot, "brand"));
      }
      const context = output(runFrom(consumer, "context", ["--brand", slug, "--surface", "site"], environment));
      assert.equal(context.slug, slug);
      assert.equal(context.valid, true);
    }
    const unselected = runFrom(consumer, "status", [], environment);
    assert.equal(unselected.status, 1);
    assert.match(unselected.stderr, /multiple Brand Packs/);
  } finally {
    await Promise.all([first.projectRoot, second.projectRoot, consumer].map(path => rm(path, { recursive: true, force: true })));
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

test("bundle portátil resolve a base fora do cwd e bloqueia referência ausente", async () => {
  const sandbox = await realpath(await mkdtemp(resolve(tmpdir(), "brand-method-bundle-")));
  try {
    const bundle = resolve(sandbox, "bundle");
    const consumer = resolve(sandbox, "consumer");
    await mkdir(consumer);
    await cp(resolve(import.meta.dirname, "../plugins/brand-runtime"), bundle, { recursive: true });
    const args = ["--experimental-strip-types", resolve(bundle, "skills/brand/scripts/brand.ts"), "context", "--mode", "brand-pending", "--surface", "product", "--project-root", consumer];
    const execute = () => spawnSync(process.execPath, args, { cwd: consumer, encoding: "utf8" });
    const data = output(execute());
    assert.ok(data.designMethod, "context deve entregar o método, não apenas citar a base");
    assert.ok(data.designMethod.foundation.content.includes("## Método comum de composição"));
    assert.equal(data.identity, null);
    await rm(resolve(bundle, data.designMethod.foundation.path));
    const missing = execute();
    assert.notEqual(missing.status, 0);
    assert.match(missing.stderr, /design-foundation\.md/);
    assert.equal(missing.stdout.trim(), "");
  } finally {
    await rm(sandbox, { recursive: true, force: true });
  }
});

for (const mode of ["brand-pending", "brand-pack"]) {
  for (const surface of ["site", "product", "presentation", "document"]) {
    test(`entrega a base de composição em ${surface}, modo ${mode}`, async () => {
      const fixture = await createBrandFixture();
      try {
        const args = ["--mode", mode, "--surface", surface];
        if (mode === "brand-pack") args.push("--brand", "checkgrow");
        const data = output(run(fixture.projectRoot, "context", args));
        assert.ok(data.designMethod, "context deve entregar o método, não apenas citar a base");
        assert.equal(data.designMethod.status, "instructions-only");
        assert.equal(data.designMethod.requiredBeforeImplementation, true);
        assert.equal(data.surface, surface);
        for (const [key, name] of [["foundation", "design-foundation.md"], ["surfaceGuidelines", "surface-guidelines.md"]]) {
          const reference = data.designMethod[key];
          const expected = await readFile(resolve(import.meta.dirname, `../plugins/brand-runtime/skills/brand/references/${name}`), "utf8");
          assert.equal(reference.path, `skills/brand/references/${name}`);
          assert.equal(reference.content, expected);
          assert.equal(reference.sha256, hash(expected));
        }
        assert.equal(data.identityClaim, mode === "brand-pack" ? "official" : "none");
        assert.deepEqual(data.brandRules, []);
        if (mode === "brand-pending") {
          assert.equal(data.identity, null);
          assert.deepEqual(data.rules, []);
        } else {
          assert.deepEqual(data.identity, { name: "Checkgrow" });
          assert.deepEqual(data.rules, surface === "site" ? ["Use the declared site system."] : surface === "document" ? ["Use the declared editorial system."] : []);
        }
      } finally {
        await rm(fixture.projectRoot, { recursive: true, force: true });
      }
    });
  }
}
