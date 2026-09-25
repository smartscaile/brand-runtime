import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

const hook = resolve(import.meta.dirname, "../plugins/brand-runtime/scripts/brand-command-hook.mjs");
const runtimeVersion = JSON.parse(await readFile(
  resolve(import.meta.dirname, "../plugins/brand-runtime/.codex-plugin/plugin.json"),
  "utf8",
)).version;

function run(input, environment = {}) {
  const result = spawnSync(process.execPath, [hook], {
    cwd: String(input.cwd || process.cwd()),
    input: JSON.stringify(input),
    encoding: "utf8",
    env: {
      ...process.env,
      BRAND_RUNTIME_CONFIG: resolve(String(input.cwd || process.cwd()), "isolated-hook-config.json"),
      BRAND_RUNTIME_BRAND_ROOT: "",
      ...environment,
    },
  });
  assert.equal(result.status, 0, result.stderr || `Hook exited with ${result.status}`);
  return result.stdout.trim();
}

function context(output) {
  return JSON.parse(output).hookSpecificOutput?.additionalContext || "";
}

test("activates Brand Runtime for >>brand and resolves Brand Packs", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "brand-runtime-hook-"));
  try {
    const brandRoot = resolve(root, "brand/checkgrow");
    await mkdir(brandRoot, { recursive: true });
    await writeFile(resolve(brandRoot, "brand.source.json"), `${JSON.stringify({ slug: "checkgrow", brandVersion: "0.5.1" }, null, 2)}\n`);
    await writeFile(resolve(brandRoot, "brand.rules.json"), `${JSON.stringify({ revision: 3 }, null, 2)}\n`);

    assert.equal(run({ cwd: root, prompt: "ordinary prompt" }), "");

    const explicit = context(run({ cwd: root, prompt: ">>brand checkgrow create a document" }));
    assert.match(explicit, /BRAND RUNTIME ACTIVE/);
    assert.ok(explicit.includes(`Brand Runtime: v${runtimeVersion}`));
    assert.match(explicit, /Brand Pack v0\.5\.1; brand rules r3/);
    assert.match(explicit, /brand\/checkgrow/);
    assert.match(explicit, /validate --brand checkgrow/);
    assert.match(explicit, /context --brand checkgrow --surface/);
    assert.doesNotMatch(explicit, /rules\/general\.json/);

    const automatic = context(run({ cwd: root, prompt: ">>brand" }));
    assert.match(automatic, /brand\/checkgrow/);

    const brandedPresentation = context(run({
      cwd: root,
      prompt: ">>brand checkgrow --presentation create a strategy deck",
    }));
    assert.match(brandedPresentation, /BRAND RUNTIME ACTIVE/);
    assert.match(brandedPresentation, /PRESENTATION WORKFLOW SELECTED/);
    assert.match(brandedPresentation, /skills\/presentation\/SKILL\.md/);
    assert.match(brandedPresentation, /Brand Pack v0\.5\.1/);

    const pendingStart = context(run({
      cwd: root,
      prompt: ">>brand start --project imovel-invest-funnel",
    }));
    assert.match(pendingStart, /NO BRAND PACK SELECTED FOR PROJECT START/);
    assert.match(pendingStart, /Do not auto-select an installed pack/);
    assert.match(pendingStart, /continue inside Brand Runtime in brand-pending/);
    assert.match(pendingStart, /context --mode brand-pending/);
    assert.doesNotMatch(pendingStart, /Use the Brand Pack at/);

    const start = context(run({
      cwd: root,
      prompt: ">>brand start --project imovel-invest-funnel --brand checkgrow",
    }));
    assert.match(start, /PROJECT START REQUESTED/);
    assert.match(start, /Project hint: imovel-invest-funnel/);
    assert.match(start, new RegExp(`Workspace reported by host: ${root.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    assert.match(start, /ask the user to confirm that exact project/);
    assert.match(start, /before following any Brand Pack selection/);
    assert.match(start, /Explicit Brand Pack candidate:/);
    assert.match(start, /Brand Pack v0\.5\.1/);
    assert.doesNotMatch(start, /Requested: start/);

    const missing = context(run({ cwd: root, prompt: ">>brand missing" }));
    assert.match(missing, /could not be resolved/);
    assert.match(missing, /Brand Portal\/Vox/);
    assert.match(missing, /Never synthesize a pack/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("activates Presentation directly with optional Brand Pack authority", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-hook-"));
  try {
    const brandRoot = resolve(root, "brand/checkgrow");
    await mkdir(brandRoot, { recursive: true });
    await writeFile(resolve(brandRoot, "brand.source.json"), `${JSON.stringify({ slug: "checkgrow", brandVersion: "0.7.0" }, null, 2)}\n`);
    await writeFile(resolve(brandRoot, "brand.rules.json"), `${JSON.stringify({ revision: 4 }, null, 2)}\n`);

    const direct = context(run({
      cwd: root,
      prompt: ">>presentation --project client-deck refine slide 03",
    }));
    assert.match(direct, /PRESENTATION RUNTIME ACTIVE/);
    assert.ok(direct.includes(`Brand Runtime: v${runtimeVersion}`));
    assert.match(direct, /Project hint: client-deck/);
    assert.match(direct, /Presentation skill: .*skills\/presentation\/SKILL\.md/);
    assert.match(direct, /NO BRAND PACK EXPLICITLY SELECTED/);
    assert.match(direct, /brand-pending/);
    assert.doesNotMatch(direct, /Use the Brand Pack at/);

    const branded = context(run({
      cwd: root,
      prompt: ">>presentation --project client-deck --brand checkgrow refine slide 03",
    }));
    assert.match(branded, /PRESENTATION RUNTIME ACTIVE/);
    assert.match(branded, /Use the Brand Pack at/);
    assert.match(branded, /Brand Pack v0\.7\.0; brand rules r4/);
    assert.match(branded, /--surface presentation/);
    assert.match(branded, /validate --brand checkgrow/);

    const missing = context(run({
      cwd: root,
      prompt: ">>presentation --brand missing create a deck",
    }));
    assert.match(missing, /explicitly requested Brand Pack is not installed/);
    assert.match(missing, /Never substitute|Do not substitute/);
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

    const pendingStart = context(run({
      cwd: consumerRoot,
      prompt: ">>brand start --project \"Client Workspace/Landing Page\"",
    }, environment));
    assert.match(pendingStart, /NO BRAND PACK SELECTED FOR PROJECT START/);
    assert.match(pendingStart, /Installed Brand Packs visible from this workspace: checkgrow, wascen/);
    assert.match(pendingStart, /Installed packs may belong to other clients/);

    const start = context(run({
      cwd: consumerRoot,
      prompt: ">>brand start --project \"Client Workspace/Landing Page\" --brand checkgrow",
    }, environment));
    assert.match(start, /PROJECT START REQUESTED/);
    assert.match(start, /Project hint: Client Workspace\/Landing Page/);
    assert.match(start, /Brand Pack v0\.5\.3/);
  } finally {
    await rm(libraryRoot, { recursive: true, force: true });
    await rm(consumerRoot, { recursive: true, force: true });
  }
});

async function multiRootFixture(t, slugs = ["alpha", "beta"]) {
  const cwd = await mkdtemp(resolve(tmpdir(), "brand-hook-multiple-roots-"));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const roots = [];
  for (const [index, slug] of slugs.entries()) {
    const root = resolve(cwd, `library-${index}`, "brand");
    await mkdir(resolve(root, slug), { recursive: true });
    await writeFile(resolve(root, slug, "brand.source.json"), JSON.stringify({ slug, brandVersion: "1.0.0" }));
    roots.push(root);
  }
  const configFile = resolve(cwd, "config.json");
  await writeFile(configFile, JSON.stringify({ schemaVersion: "1.0.0", brandRoot: roots[0], additionalBrandRoots: roots.slice(1) }));
  return { cwd, roots, env: { BRAND_RUNTIME_CONFIG: configFile, BRAND_RUNTIME_BRAND_ROOT: "" } };
}

test("hook uses the requested slug's global root instead of pinning the primary root", async (t) => {
  const { cwd, roots: [first, second], env } = await multiRootFixture(t);
  for (const prompt of [">>brand beta", ">>brand --brand beta", ">>brand start --brand beta", ">>presentation --brand beta"]) {
    const text = context(run({ cwd, prompt }, env));
    assert.ok(text.includes(`${second}/beta`), text);
    assert.ok(text.includes(`validate --brand beta --brand-root "${second}"`), text);
    assert.ok(!text.includes(`--brand-root "${first}"`), text);
  }
  const firstText = context(run({ cwd, prompt: ">>brand alpha" }, env));
  assert.ok(firstText.includes(`validate --brand alpha --brand-root "${first}"`));
  const noSelection = context(run({ cwd, prompt: ">>brand start" }, env));
  assert.match(noSelection, /Installed Brand Packs visible from this workspace: alpha, beta/);
  assert.doesNotMatch(noSelection, /Use the Brand Pack at|validate --brand/);
  await mkdir(resolve(cwd, "brand/alpha"), { recursive: true });
  await writeFile(resolve(cwd, "brand/alpha/brand.source.json"), "{}");
  const fallback = context(run({ cwd, prompt: ">>brand beta" }, env));
  assert.ok(fallback.includes(`validate --brand beta --brand-root "${second}"`));
  assert.match(fallback, /user-config/);
});

test("hook exposes duplicate slugs without auto-selection or replacement configuration", async (t) => {
  const { cwd, roots, env } = await multiRootFixture(t, ["shared", "shared"]);
  for (const prompt of [">>brand", ">>brand shared", ">>brand start", ">>brand start --brand shared", ">>presentation --brand shared"]) {
    const text = context(run({ cwd, prompt }, env));
    assert.match(text, /Ambiguous Brand Packs/);
    for (const root of roots) assert.ok(text.includes(root), text);
    assert.doesNotMatch(text, /Use the Brand Pack at|validate --brand|config set --brand-root/);
  }
});

test("hook reports a missing global slug without proposing replacement of the configured library", async (t) => {
  const { cwd, env } = await multiRootFixture(t);
  const brand = context(run({ cwd, prompt: ">>brand missing" }, env));
  assert.match(brand, /could not be resolved/);
  assert.match(brand, /alpha, beta/);
  assert.match(brand, /Never synthesize a pack/);
  assert.doesNotMatch(brand, /config set --brand-root|validate --brand/);
  const presentation = context(run({ cwd, prompt: ">>presentation --brand missing" }, env));
  assert.match(presentation, /explicitly requested Brand Pack is not installed/);
  assert.doesNotMatch(presentation, /config set --brand-root|validate --brand/);
});

test("hook reports invalid global bindings without suggesting library replacement", async (t) => {
  const { cwd, roots: [first, second], env } = await multiRootFixture(t, ["shared", "shared"]);
  await mkdir(resolve(second, "keeper"));
  await writeFile(resolve(second, "keeper/brand.source.json"), "{}");
  for (const binding of [null, { shared: resolve(cwd, "unregistered/brand") }, { shared: second }]) {
    await writeFile(env.BRAND_RUNTIME_CONFIG, JSON.stringify({ schemaVersion: "1.0.0", brandRoot: first, additionalBrandRoots: [second], brandRootsBySlug: binding }));
    if (binding?.shared === second) await rm(resolve(second, "shared/brand.source.json"));
    const before = await readFile(env.BRAND_RUNTIME_CONFIG, "utf8");
    for (const prompt of [">>brand shared", ">>brand start --brand shared", ">>presentation --brand shared"]) {
      const text = context(run({ cwd, prompt }, env));
      assert.match(text, /BRAND BINDING REQUIRES REVIEW/);
      assert.match(text, /brandRootsBySlug/);
      assert.doesNotMatch(text, /Use the Brand Pack at|validate --brand|config set --brand-root/);
      assert.match(text, /Do not replace the saved library/);
    }
    assert.equal(await readFile(env.BRAND_RUNTIME_CONFIG, "utf8"), before);
  }
});

test("hook requires a slug before using a bound global duplicate instead of pinning the primary copy", async (t) => {
  const { cwd, roots: [first, second], env } = await multiRootFixture(t, ["shared", "shared"]);
  await writeFile(env.BRAND_RUNTIME_CONFIG, JSON.stringify({ schemaVersion: "1.0.0", brandRoot: first, additionalBrandRoots: [second], brandRootsBySlug: { shared: second } }));
  const unselected = context(run({ cwd, prompt: ">>brand" }, env));
  assert.match(unselected, /BRAND PACK SLUG SELECTION REQUIRED/);
  assert.doesNotMatch(unselected, /Use the Brand Pack at|validate --brand/);
  assert.match(unselected, />>brand shared/);
  for (const prompt of [">>brand shared", ">>brand --brand shared", ">>brand start --brand shared", ">>presentation --brand shared"]) {
    const selected = context(run({ cwd, prompt }, env));
    assert.ok(selected.includes(`${second}/shared`), selected);
    assert.ok(selected.includes(`validate --brand shared --brand-root "${second}"`), selected);
    assert.ok(!selected.includes(`--brand-root "${first}"`), selected);
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

    const pendingStart = context(run({
      cwd: consumerRoot,
      prompt: ">>brand start --project new-client-site",
    }, environment));
    assert.match(pendingStart, /NO BRAND PACK SELECTED FOR PROJECT START/);
    assert.match(pendingStart, /continue inside Brand Runtime in brand-pending/);
    assert.doesNotMatch(pendingStart, /BRAND FOLDER CONFIGURATION REQUIRED/);

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
