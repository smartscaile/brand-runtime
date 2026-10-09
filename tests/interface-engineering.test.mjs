import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const plugin = resolve(root, "plugins/brand-runtime");
const digest = value => createHash("sha256").update(value).digest("hex");
const text = path => readFile(resolve(plugin, path), "utf8");
const expectedIds = ["navigation-shell", "editorial-disclosure", "action-feedback", "attention-cue", "scroll-surface", "scene-lifecycle", "event-stream", "ambient-rail", "stable-alternatives", "connected-diagram", "simulator", "external-handoff", "quantitative-indicator", "diagnostic-scaffold", "dependent-sequence", "logical-fit", "product-inspection", "compact-record", "detail-distribution", "async-join", "numeric-comparison", "capability-plan", "evidence-viewer", "accessible-marquee"];

function context(bundle, cwd, mode, surface, brand) {
  const args = [resolve(bundle, "skills/brand/scripts/brand.ts"), "context", "--mode", mode, "--surface", surface, "--project-root", cwd];
  if (brand) args.push("--brand", brand);
  return spawnSync(process.execPath, args, { cwd, encoding: "utf8", env: { ...process.env, BRAND_RUNTIME_BRAND_ROOT: "" } });
}

async function fixture(parent, slug, color, font) {
  const path = resolve(parent, "brand", slug);
  await mkdir(path, { recursive: true });
  const source = JSON.stringify({ slug, brandVersion: "1.0.0", schemaVersion: "1.0.0", identity: { name: slug }, voice: { language: "pt" }, surfaces: { product: ["Preservar dados completos."] } });
  const tokens = JSON.stringify({ slug, brandVersion: "1.0.0", sourceHash: digest(source), colors: { accent: color }, typography: { body: font }, layout: {}, motion: {}, assets: {} });
  const guide = `# Fixture sintética ${slug}\n`;
  for (const [name, value] of Object.entries({ "brand.source.json": source, "tokens.json": tokens, "brand-guidelines.md": guide, "build-manifest.json": JSON.stringify({ slug, brandVersion: "1.0.0", sourceHash: digest(source), artifacts: { "tokens.json": digest(tokens), "brand-guidelines.md": digest(guide) }, assetHashes: {} }) })) await writeFile(resolve(path, name), value);
}

test("catálogo portátil cobre famílias por função sem copiar identidade ou aprovações", async () => {
  const raw = await text("skills/brand/references/interface-patterns.json");
  const catalog = JSON.parse(raw);
  assert.equal(catalog.version, "1.0.0");
  assert.equal(catalog.kind, "engineering-recipes-not-visual-templates");
  assert.deepEqual(catalog.patterns.map(item => item.id), expectedIds);
  assert.equal(new Set(catalog.patterns.map(item => item.id)).size, expectedIds.length);
  for (const pattern of catalog.patterns) {
    for (const key of ["title", "relation", "useWhen", "avoidWhen", "sizing", "motion", "staticFallback"]) assert.ok(pattern[key]?.trim(), `${pattern.id}.${key}`);
    for (const key of ["anatomy", "states", "bindings", "checks", "surfaces"]) assert.ok(Array.isArray(pattern[key]) && pattern[key].length, `${pattern.id}.${key}`);
    assert.equal(pattern.approval, "consumer-review-required");
    assert.ok(pattern.surfaces.every(value => ["site", "product", "presentation", "document"].includes(value)));
  }
  assert.doesNotMatch(raw, /#[0-9a-f]{3,8}\b|Instrument Sans|Inter Tight|Playfair|smartscaile|seudominio|GTM-|\/Users\//i);
});

for (const mode of ["brand-pending", "brand-pack"]) for (const surface of ["site", "product", "presentation", "document"]) {
  test(`context entrega engenharia e índice verificado em ${mode}/${surface}`, async () => {
    const cwd = await mkdtemp(resolve(tmpdir(), "interface-context-"));
    try {
      if (mode === "brand-pack") await fixture(cwd, "synthetic-a", "fixture-color-a", "fixture-font-a");
      const result = context(plugin, cwd, mode, surface, mode === "brand-pack" ? "synthetic-a" : undefined);
      assert.equal(result.status, 0, result.stderr);
      const data = JSON.parse(result.stdout);
      assert.equal(data.designMethod.status, "instructions-only");
      const guide = data.designMethod.interfaceEngineering;
      assert.equal(guide.path, "skills/brand/references/interface-engineering.md");
      assert.equal(guide.content, await text(guide.path));
      assert.equal(guide.sha256, digest(guide.content));
      const index = data.designMethod.patternCatalog;
      assert.equal(index.path, "skills/brand/references/interface-patterns.json");
      const raw = await text(index.path);
      assert.equal(index.sha256, digest(raw));
      const relevant = JSON.parse(raw).patterns.filter(item => item.surfaces.includes(surface));
      assert.deepEqual(index.patterns, relevant.map(({ id, title, relation }) => ({ id, title, relation })));
      assert.equal(index.detailsRequireRead, true);
      assert.equal(data.designMethod.interfaceMechanics.optional, true);
      assert.equal(data.designMethod.interfaceMechanics.reuseAuthorization, "owner-or-separate-permission");
      assert.equal(data.designMethod.interfaceMechanics.publicLicenseGranted, false);
      assert.equal(data.designMethod.interfaceMechanics.sha256, digest(await text(data.designMethod.interfaceMechanics.path)));
      assert.deepEqual(data.brandRules, []);
      assert.equal(data.identityClaim, mode === "brand-pack" ? "official" : "none");
      if (mode === "brand-pack") {
        assert.deepEqual(data.colors, { accent: "fixture-color-a" });
        assert.deepEqual(data.typography, { body: "fixture-font-a" });
      } else assert.equal(data.identity, null);
    } finally { await rm(cwd, { recursive: true, force: true }); }
  });
}

test("duas identidades recebem a mesma engenharia sem contaminar tokens", async () => {
  const cwd = await mkdtemp(resolve(tmpdir(), "interface-packs-"));
  try {
    await fixture(cwd, "synthetic-a", "fixture-color-a", "fixture-font-a");
    await fixture(cwd, "synthetic-b", "fixture-color-b", "fixture-font-b");
    const results = ["synthetic-a", "synthetic-b"].map(slug => context(plugin, cwd, "brand-pack", "product", slug));
    results.forEach(result => assert.equal(result.status, 0, result.stderr));
    const [a, b] = results.map(result => JSON.parse(result.stdout));
    assert.deepEqual(a.designMethod, b.designMethod);
    assert.notDeepEqual(a.colors, b.colors);
    assert.notDeepEqual(a.typography, b.typography);
    assert.equal(a.designAuthority.uiOwner, "project");
  } finally { await rm(cwd, { recursive: true, force: true }); }
});

for (const missing of ["references/interface-engineering.md", "references/interface-patterns.json", "assets/interface/scene-runtime.mjs"]) test(`bundle realocado falha se faltar ${missing}`, async () => {
  const sandbox = await mkdtemp(resolve(tmpdir(), "interface-bundle-"));
  try {
    const bundle = resolve(sandbox, "bundle");
    const cwd = resolve(sandbox, "empty-consumer");
    await cp(plugin, bundle, { recursive: true });
    await mkdir(cwd);
    const before = context(bundle, cwd, "brand-pending", "site");
    assert.equal(before.status, 0, before.stderr);
    await rm(resolve(bundle, "skills/brand", missing));
    const result = context(bundle, cwd, "brand-pending", "site");
    assert.notEqual(result.status, 0);
    assert.equal(result.stdout.trim(), "");
    assert.ok(result.stderr.includes(missing.split("/").at(-1)));
  } finally { await rm(sandbox, { recursive: true, force: true }); }
});

test("entradas Brand e Presentation carregam a mesma base sem reabrir gates", async () => {
  for (const path of ["skills/brand/SKILL.md", "skills/presentation/SKILL.md"]) assert.match(await text(path), /interface-engineering\.md/);
  const guide = await text("skills/brand/references/interface-engineering.md");
  for (const term of ["protectedAxes", "interactionMode", "reentry", "primeiro paint", "mesmo tempo físico", "licença", "aprovação humana", "impressão", "Chakra"]) assert.ok(guide.toLowerCase().includes(term.toLowerCase()), term);
  assert.match(guide, /não instala.*React/i);
  assert.doesNotMatch(guide, /#[0-9a-f]{3,8}\b|Instrument Sans|Inter Tight|Playfair|\/Users\//i);
  assert.match(await text("skills/presentation/SKILL.md"), /build exactly three slides/);
});
