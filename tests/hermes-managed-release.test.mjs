import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

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

test("requires Brand Runtime v0.9.0 across release metadata", async () => {
  const packageManifest = await readJson("package.json");
  const packageLock = await readJson("package-lock.json");
  const project = await readJson("project.json");
  const portable = await readJson("plugins/brand-runtime/plugin.json");
  const claude = await readJson("plugins/brand-runtime/.claude-plugin/plugin.json");
  const codex = await readJson("plugins/brand-runtime/.codex-plugin/plugin.json");

  assert.equal(packageManifest.version, "0.9.0");
  assert.equal(packageLock.version, "0.9.0");
  assert.equal(packageLock.packages[""].version, "0.9.0");
  assert.equal(project.version.current, "0.9.0");
  assert.equal(portable.version, "0.9.0");
  assert.equal(claude.version, "0.9.0");
  assert.equal(codex.version, "0.9.0");
});

test("documents canonical distribution paths across supported hosts", async () => {
  const integrations = await readText("docs/integrations.md");
  const canonicalPaths = [
    ".agents/plugins/marketplace.json",
    ".claude-plugin/marketplace.json",
    "plugins/brand-runtime/.codex-plugin/plugin.json",
    "plugins/brand-runtime/.claude-plugin/plugin.json",
    "plugins/brand-runtime/plugin.json",
    "plugins/brand-runtime/skills/",
    "plugins/brand-runtime/hooks/hooks.json",
  ];

  for (const path of canonicalPaths) {
    assert.ok(integrations.includes(`\`${path}\``), `${path} must be documented`);
  }
});

test("documents the guard self-scan and bounded legacy literals", async () => {
  const testing = await readText("docs/testing.md");
  assert.match(testing, /inclui o próprio arquivo do guard/i);
  assert.match(testing, /hashes das linhas autorizadas/i);
  assert.doesNotMatch(testing, /excluído do scan/i);
});

test("keeps Codex Claude Code and Hermes aligned as supported hosts", async () => {
  const agents = await readText("AGENTS.md");
  const interfaceContract = await readText("INTERFACE.md");
  assert.match(agents, /Codex, Claude Code e Hermes/);
  assert.match(interfaceContract, /Codex, Claude Code e Hermes/);
  assert.ok(agents.includes("plugins/brand-runtime/plugin.json"));
});

test("distinguishes current Hermes source from an explicit immutable pin", async () => {
  const contract = await readJson("plugins/brand-runtime/skills/brand/references/runtime-update.json");
  const readme = await readText("README.md");
  const decisions = await readText("docs/decisions.md");
  const integrations = await readText("docs/integrations.md");
  const standardCommand = contract.runtimes.hermes.managedSource.agentCommands[0];

  assert.doesNotMatch(standardCommand, /--ref/);
  assert.match(readme, /current official source/i);
  assert.match(readme, /--ref <SHA-40>/);
  assert.match(decisions, /fonte oficial corrente/i);
  assert.match(decisions, /--ref <SHA-40>/);
  assert.match(integrations, /fonte oficial corrente/i);
  assert.match(integrations, /--ref <SHA-40>/);
  assert.ok(contract.guardrails.some((rule) => rule.includes("--ref <SHA-40>")));
});

test("distributes the progressive three-slide approval gate", async () => {
  const skill = await readText("plugins/brand-runtime/skills/presentation/SKILL.md");
  const creation = markdownSection(skill, "Create or restructure");
  const requiredStatements = [
    "Before building any slides, present and obtain explicit approval of the brief, output folder, narrative, visual thesis, and evidence plan.",
    "Approval of an isolated checkpoint does not approve the others or authorize the complete deck.",
    "For the first implementation, build exactly three slides, slides 1–3 by default.",
    "Do not create later slides in the authoring HTML or DOM, in `presentation.spec.json`, or as placeholders.",
    "Build the remaining slides only after explicit human approval of the first batch.",
  ];

  for (const statement of requiredStatements) {
    assert.ok(creation.includes(statement), `Missing distributed presentation gate: ${statement}`);
  }
  assert.doesNotMatch(creation, /representative slides before scaling/i);
});

test("keeps the progressive presentation gate aligned across canonical sources", async () => {
  for (const path of ["AGENTS.md", "INTERFACE.md", "DESIGNSYSTEM.MD", "docs/flows.md"]) {
    const content = await readText(path);
    assert.match(content, /exatamente três slides/i, `${path} must require exactly three slides`);
    assert.match(content, /slides\s+1[–-]3/i, `${path} must default to slides 1–3`);
    assert.match(content, /aprova(?:ção(?: humana)?\s+explícita|\s+explicitamente)/i, `${path} must require explicit approval`);
    assert.match(content, /placeholders/i, `${path} must forbid placeholders`);
    assert.doesNotMatch(content, /três slides representativos|abertura ou tese, evidência complexa/i);
  }
});

test("distributes identity-neutral layout reasoning instead of Taste presets", async () => {
  const skill = await readText("plugins/brand-runtime/skills/presentation/SKILL.md");
  const visual = await readText("plugins/brand-runtime/skills/presentation/references/visual-system.md");
  const refinement = await readText("plugins/brand-runtime/skills/presentation/references/refinement.md");
  const quality = await readText("plugins/brand-runtime/skills/presentation/references/quality-policy.md");
  const designSystem = await readText("DESIGNSYSTEM.MD");
  const creation = markdownSection(skill, "Create or restructure");

  for (const statement of [
    "Map content before selecting a composition family.",
    "Choose by narrative fit, evidence, approved direction, and neighboring rhythm; never by randomization or preset rotation.",
    "Review the first batch at thumbnail, full-slide, and detail scales.",
  ]) {
    assert.ok(creation.includes(statement), `Missing distributed layout reasoning: ${statement}`);
  }

  for (const heading of [
    "## Layout reasoning workflow",
    "### Content map",
    "### Composition profile",
    "### Structural candidates",
    "### Batch rhythm",
  ]) {
    assert.ok(visual.includes(heading), `Missing visual-system section: ${heading}`);
  }

  assert.match(visual, /\.\.\/\.\.\/brand\/references\/design-foundation\.md/);
  assert.match(visual, /Review slides 1–3 as a thumbnail sequence/);
  assert.match(refinement, /\.\.\/\.\.\/brand\/references\/design-foundation\.md/);

  for (const scale of ["### Thumbnail scale", "### Full-slide scale", "### Detail scale"]) {
    assert.ok(refinement.includes(scale), `Missing refinement scale: ${scale}`);
  }

  assert.match(quality, /## External method adaptation/);
  assert.match(quality, /\.\.\/\.\.\/brand\/references\/design-method-provenance\.md/);
  const provenance = await readText("plugins/brand-runtime/skills/brand/references/design-method-provenance.md");
  for (const pin of ["ccbc15639c97057cbfcf32ecebc38ef716e4bb37", "b72132fcd466da605623ffe96e370b3991fc5285", "03ed209b8fdc0a3cd6bccf8a5b3bfffe56aa4558"])
    assert.ok(provenance.includes(pin), `Proveniência ausente: ${pin}`);
  assert.match(provenance, /MIT/);
  for (const disposition of ["adapt", "reject", "defer", "reference-only"]) {
    assert.ok(provenance.includes("| `" + disposition + "` |"), `Missing adoption disposition: ${disposition}`);
  }
  assert.match(provenance, /Não distribui código, presets, assets, fontes, paletas ou receitas de componentes/);

  assert.match(designSystem, /mapa de conteúdo/i);
  assert.match(designSystem, /perfil de composição/i);
  assert.match(designSystem, /randomização/i);

  assert.doesNotMatch(
    [creation, visual, refinement].join("\n"),
    /DESIGN_VARIANCE|MOTION_INTENSITY|VISUAL_DENSITY|random\.choice|AIDA|Awwwards|Satoshi|Cabinet Grotesk/i,
  );
});

test("distribui composição e crítica como base comum antes da implementação", async () => {
  const brand = await readText("plugins/brand-runtime/skills/brand/SKILL.md");
  const presentation = await readText("plugins/brand-runtime/skills/presentation/SKILL.md");
  const foundation = await readText("plugins/brand-runtime/skills/brand/references/design-foundation.md");
  const template = await readText("plugins/brand-runtime/skills/brand/references/design-direction-template.md");
  for (const heading of [
    "## Método comum de composição", "### Mapa de conteúdo", "### Perfil de composição",
    "### Candidatos estruturais", "### Prova antes de escalar", "## Crítica em três escalas",
    "## Refinamento pela causa", "## Diagnósticos de composição genérica",
  ]) assert.ok(foundation.includes(heading), `Base comum sem ${heading}`);
  for (const term of ["afirmação", "evidência", "relação", "densidade", "restrições", "distribuição", "simetria", "continuidade"])
    assert.ok(foundation.toLowerCase().includes(term), `Conceito ausente: ${term}`);
  assert.match(foundation, /pelo menos duas estruturas/);
  assert.match(foundation, /aprovação humana/);
  assert.match(foundation, /antes de implementar/);
  assert.match(foundation, /Não use.*score/);
  assert.match(brand, /designMethod/);
  assert.match(presentation, /\.\.\/brand\/references\/design-foundation\.md/);
  for (const heading of ["## Mapa de conteúdo", "## Perfil e decisão de composição", "## Evidência de revisão"])
    assert.ok(template.includes(heading), `Direção local sem ${heading}`);
  assert.doesNotMatch(foundation, /DESIGN_VARIANCE|MOTION_INTENSITY|VISUAL_DENSITY|random\.choice|AIDA|Awwwards|Satoshi|Cabinet Grotesk/i);
});

test("requires the executable managed Hermes install and update command", async () => {
  const contract = await readJson("plugins/brand-runtime/skills/brand/references/runtime-update.json");
  const readme = await readText("README.md");
  const command = "hermes plugins install smartscaile/brand-runtime/plugins/brand-runtime --force --enable";

  assert.equal(contract.runtimes.hermes.managedSource.agentCommands[0], command);
  assert.match(markdownSection(readme, "Install in Hermes"), new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(markdownSection(readme, "Update in Hermes"), new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("forbids Hermes symlink installation guidance", async () => {
  const contract = await readJson("plugins/brand-runtime/skills/brand/references/runtime-update.json");
  const readme = await readText("README.md");
  const pluginReadme = await readText("plugins/brand-runtime/README.md");
  const serializedContract = JSON.stringify(contract.runtimes.hermes);

  assert.equal(contract.runtimes.hermes.linkedSource, undefined);
  assert.doesNotMatch(serializedContract, /symlink|symbolic link|linked.source/i);
  assert.doesNotMatch(readme, /symlink|symbolic link|linked.source/i);
  assert.doesNotMatch(pluginReadme, /symlink|symbolic link|linked.source/i);
});
