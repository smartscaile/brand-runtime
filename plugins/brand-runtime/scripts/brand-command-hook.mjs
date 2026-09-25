#!/usr/bin/env node

import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveBrandRoot } from "./brand-root-config.mjs";

function readInput() {
  try {
    const raw = readFileSync(0, "utf8");
    return raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function isDirectory(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function optionValue(prompt, name) {
  const match = prompt.match(new RegExp(`(?:^|\\s)--${name}(?:=|\\s+)(?:"([^"]+)"|'([^']+)'|([^\\s]+))`, "iu"));
  return (match?.[1] || match?.[2] || match?.[3] || "").trim();
}

function hasFlag(prompt, name) {
  return new RegExp(`(?:^|\\s)--${name}(?=\\s|$)`, "iu").test(prompt);
}

function parseBrandRequest(prompt) {
  const command = prompt.match(/(?:^|\s)>>brand(?=\s|$)([\s\S]*)/iu);
  const tail = command?.[1] || "";
  const firstToken = tail.trimStart().match(/^([^\s]+)/u)?.[1] || "";
  const action = firstToken.toLowerCase() === "start" ? "start" : "brand";
  const explicitBrand = optionValue(tail, "brand").toLowerCase();
  const positionalBrand = action === "brand" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/iu.test(firstToken)
    ? firstToken.toLowerCase()
    : "";

  return {
    entry: "brand",
    action,
    requested: explicitBrand || positionalBrand,
    projectHint: optionValue(tail, "project"),
    presentation: hasFlag(tail, "presentation"),
  };
}

function parsePresentationRequest(prompt) {
  const command = prompt.match(/(?:^|\s)>>presentation(?=\s|$)([\s\S]*)/iu);
  const tail = command?.[1] || "";
  return {
    entry: "presentation",
    action: "presentation",
    requested: optionValue(tail, "brand").toLowerCase(),
    projectHint: optionValue(tail, "project"),
    presentation: true,
  };
}

function parseRuntimeRequest(prompt) {
  if (/(?:^|\s)>>presentation(?=\s|$)/iu.test(prompt)) return parsePresentationRequest(prompt);
  return parseBrandRequest(prompt);
}

function projectStartContext({ cwd, projectHint }) {
  return [
    "PROJECT START REQUESTED",
    `Workspace reported by host: ${cwd}`,
    `Project hint: ${projectHint || "not provided"}.`,
    "Treat both values only as evidence; neither is a confirmed project.",
    "Use the smallest useful read-only inspection to propose the most likely project, without assuming a projects/ folder, repository layout, framework, or configured registry.",
    "Before a project-wide scan, project command, source or document loading, or any write, state the candidate name and absolute path and ask the user to confirm that exact project.",
    "Complete this confirmation before following any Brand Pack selection, configuration, or validation instruction below.",
    "If there is no single clear candidate, ask which project to use. Accept a name, relative path, or absolute path and never silently choose a directory.",
  ].join("\n");
}

function pluginVersion(pluginRoot) {
  for (const relativePath of [".codex-plugin/plugin.json", ".claude-plugin/plugin.json"]) {
    const manifestFile = resolve(pluginRoot, relativePath);
    if (!existsSync(manifestFile)) continue;
    try {
      const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
      if (typeof manifest.version === "string" && manifest.version) return manifest.version;
    } catch {
      // Try the next runtime manifest.
    }
  }
  return "unknown";
}

function packLabel(brandRoot) {
  const sourceFile = resolve(brandRoot, "brand.source.json");
  const rulesFile = resolve(brandRoot, "brand.rules.json");
  let brandVersion = "unknown";
  let rulesRevision = 0;

  try {
    if (existsSync(sourceFile)) {
      const source = JSON.parse(readFileSync(sourceFile, "utf8"));
      brandVersion = source.brandVersion || "unknown";
    }
    if (existsSync(rulesFile)) {
      const rules = JSON.parse(readFileSync(rulesFile, "utf8"));
      rulesRevision = Number.isInteger(rules.revision) ? rules.revision : "invalid";
    }
  } catch {
    return "invalid Brand Pack metadata";
  }

  return `Brand Pack v${brandVersion}; brand rules r${rulesRevision}`;
}

function ambiguousBrandContext(brandResolution) {
  return [
    "BRAND PACK ROOT SELECTION REQUIRED",
    brandResolution.reason,
    "Ask the user to choose the intended absolute brand folder and pass it explicitly with --brand-root for this task.",
    "Do not replace the saved library or substitute another pack. Stop official branded work until the ambiguity is resolved.",
  ].join("\n");
}

function bindingReviewContext(brandResolution) {
  if (brandResolution.ok || !brandResolution.reason?.startsWith("brandRootsBySlug:")) return "";
  return [
    "BRAND BINDING REQUIRES REVIEW",
    brandResolution.reason,
    "Inspect config show and ask the user to confirm the official registered folder before changing a binding.",
    "Do not replace the saved library, move historical folders, or select another copy as fallback. Stop official branded work until the binding is valid.",
  ].join("\n");
}

function projectStartActivation({ cwd, pluginRoot, runtimeVersion, requested, projectHint, brandResolution }) {
  const skillRoot = resolve(pluginRoot, "skills", "brand");
  const cli = resolve(skillRoot, "scripts", "brand.ts");
  const available = brandResolution.brands || [];
  const availableLine = available.length > 0 ? available.join(", ") : "none";
  const lines = [
    "BRAND RUNTIME ACTIVE (>>brand detected)",
    `Brand Runtime: v${runtimeVersion}`,
    "",
    projectStartContext({ cwd, projectHint }),
    "",
    ...(brandResolution.status === "ambiguous" ? [ambiguousBrandContext(brandResolution), ""] : []),
    ...(requested && bindingReviewContext(brandResolution) ? [bindingReviewContext(brandResolution), ""] : []),
  ];

  if (!requested) {
    return [
      ...lines,
      "NO BRAND PACK SELECTED FOR PROJECT START",
      `Installed Brand Packs visible from this workspace: ${availableLine}.`,
      "Do not auto-select an installed pack or require Brand Pack configuration merely to start. Installed packs may belong to other clients.",
      "After project confirmation and audit, use brand-pack only for an explicitly selected semantic match. If no official pack exists, continue inside Brand Runtime in brand-pending; do not tell the user to leave Brand Runtime.",
      "In brand-pending, make no official identity claim and keep all visual roles provisional and project-local.",
      `Pending context after confirmation: node --experimental-strip-types "${cli}" context --mode brand-pending --surface <site|product|presentation|document> --project-root "<confirmed-project>"`,
      "",
      `Universal skill: ${skillRoot}/SKILL.md`,
    ].join("\n");
  }

  const selectedRoot = brandResolution.ok ? resolve(brandResolution.brandRoot, requested) : "";
  if (!selectedRoot || !isDirectory(selectedRoot)) {
    return [
      ...lines,
      `The explicitly requested Brand Pack could not be resolved: ${requested}. Installed: ${availableLine}.`,
      "Do not substitute another installed Brand Pack.",
      "After project confirmation, ask for the correct pack only if official identity is required. If the project has no official pack and the user approves provisional direction, continue in brand-pending without claiming brand compliance.",
      "",
      `Universal skill: ${skillRoot}/SKILL.md`,
    ].join("\n");
  }

  return [
    ...lines,
    `Explicit Brand Pack candidate: ${selectedRoot} (${packLabel(selectedRoot)}).`,
    "After project confirmation, verify that this pack semantically belongs to the project before using it.",
    `node --experimental-strip-types "${cli}" status --brand ${requested} --brand-root "${brandResolution.brandRoot}"`,
    `node --experimental-strip-types "${cli}" validate --brand ${requested} --brand-root "${brandResolution.brandRoot}"`,
    `node --experimental-strip-types "${cli}" context --mode brand-pack --brand ${requested} --surface <site|product|presentation|document> --brand-root "${brandResolution.brandRoot}" --project-root "<confirmed-project>"`,
    "Never fall back to another client's pack if semantic validation fails.",
    "",
    `Universal skill: ${skillRoot}/SKILL.md`,
  ].join("\n");
}

function activationContext({ cwd, pluginRoot, runtimeVersion, action, requested, projectHint, brandResolution }) {
  if (action === "start") {
    return projectStartActivation({ cwd, pluginRoot, runtimeVersion, requested, projectHint, brandResolution });
  }

  const skillRoot = resolve(pluginRoot, "skills", "brand");
  const cli = resolve(skillRoot, "scripts", "brand.ts");
  const available = brandResolution.brands || [];
  const availableLine = available.length > 0 ? available.join(", ") : "none";
  const configuredPath = brandResolution.brandRoot || brandResolution.configuredBrandRoot || "not configured";

  const bindingReview = bindingReviewContext(brandResolution);
  if (bindingReview) {
    return [
      "BRAND RUNTIME ACTIVE (>>brand detected)",
      `Brand Runtime: v${runtimeVersion}`,
      "",
      bindingReview,
      `Universal skill: ${skillRoot}/SKILL.md`,
    ].join("\n");
  }
  if (brandResolution.status === "ambiguous") {
    return [
      "BRAND RUNTIME ACTIVE (>>brand detected)",
      `Brand Runtime: v${runtimeVersion}`,
      "",
      ambiguousBrandContext(brandResolution),
      `Universal skill: ${skillRoot}/SKILL.md`,
    ].join("\n");
  }
  if (!brandResolution.ok && brandResolution.status !== "brand-not-found") {
    return [
      "BRAND RUNTIME ACTIVE (>>brand detected)",
      `Brand Runtime: v${runtimeVersion}`,
      "",
      "BRAND FOLDER CONFIGURATION REQUIRED",
      `${brandResolution.reason} Current path: ${configuredPath}.`,
      "Ask the user for the absolute path to the downloaded folder named brand.",
      "The selected folder must directly contain one or more Brand Pack folders, for example brand/example-brand/brand.source.json.",
      "Do not ask the user to copy the Brand Pack into the current project.",
      "After the user replies, configure and validate it with:",
      `node --experimental-strip-types "${cli}" config set --brand-root "<absolute-path-to-brand-folder>"`,
      "Stop branded work until configuration reports status ready.",
      "",
      `Universal skill: ${skillRoot}/SKILL.md`,
      `Config file: ${brandResolution.configFile || "runtime default"}`,
      `Working directory: ${cwd}`,
    ].join("\n");
  }

  if (!requested && available.length === 1 && Object.hasOwn(brandResolution.brandRootsBySlug || {}, available[0])) {
    return [
      "BRAND RUNTIME ACTIVE (>>brand detected)",
      `Brand Runtime: v${runtimeVersion}`,
      "",
      "BRAND PACK SLUG SELECTION REQUIRED",
      `A global folder binding exists for ${available[0]}; discovery alone does not select identity for this task.`,
      `Ask the user to select >>brand ${available[0]} before branded work. Do not pin the primary folder implicitly.`,
      `Universal skill: ${skillRoot}/SKILL.md`,
    ].join("\n");
  }
  const slug = requested || (available.length === 1 ? available[0] : "");
  const selectedRoot = slug ? resolve(brandResolution.brandRoot, slug) : "";
  if (!slug || !isDirectory(selectedRoot)) {
    return [
      "BRAND RUNTIME ACTIVE (>>brand detected)",
      `Brand Runtime: v${runtimeVersion}`,
      "",
      `The requested Brand Pack could not be resolved. Requested: ${requested || "not selected"}. Installed: ${availableLine}.`,
      "The configured brand folder supports multiple Brand Packs, but exactly one slug must be selected for each task.",
      "Ask the user to invoke >>brand <installed-slug> or select one of the installed slugs before branded work.",
      "If the intended slug is not installed, ask the user to obtain its Brand Pack from Brand Portal/Vox and add it as a sibling inside the configured brand folder. Never synthesize a pack.",
      "",
      `Universal skill: ${skillRoot}/SKILL.md`,
      `Brand folder: ${brandResolution.brandRoot}`,
      `Brand folder source: ${brandResolution.source}`,
    ].join("\n");
  }

  const brandRoot = selectedRoot;
  return [
    "BRAND RUNTIME ACTIVE (>>brand detected)",
    `Brand Runtime: v${runtimeVersion}`,
    "",
    `Use the Brand Pack at ${brandRoot} (${packLabel(brandRoot)}).`,
    `Configured brand folder: ${brandResolution.brandRoot} (${brandResolution.source}).`,
    `Installed Brand Packs: ${availableLine}.`,
    "Read and follow the universal skill before creating or reviewing branded output:",
    `${skillRoot}/SKILL.md`,
    "",
    "Run these checks before operating:",
    `node --experimental-strip-types "${cli}" status --brand ${slug} --brand-root "${brandResolution.brandRoot}"`,
    `node --experimental-strip-types "${cli}" validate --brand ${slug} --brand-root "${brandResolution.brandRoot}"`,
    `node --experimental-strip-types "${cli}" context --brand ${slug} --surface <site|product|presentation|document> --brand-root "${brandResolution.brandRoot}"`,
    "Stop if validation fails. The Brand Pack is required and remains the source of identity; universal design foundations never replace it.",
  ].join("\n");
}

function presentationSkillContext(pluginRoot) {
  const presentationSkillRoot = resolve(pluginRoot, "skills", "presentation");
  return [
    "",
    "PRESENTATION WORKFLOW SELECTED",
    `Read and follow the Presentation skill: ${presentationSkillRoot}/SKILL.md`,
    "Use the Brand skill as identity authority and the Presentation skill for narrative, slide refinement, fixed-page HTML, export, and rendered QA.",
    "Do not duplicate Brand Pack identity inside presentation mechanics.",
  ].join("\n");
}

function directPresentationActivation({ cwd, pluginRoot, runtimeVersion, requested, projectHint, brandResolution }) {
  const brandSkillRoot = resolve(pluginRoot, "skills", "brand");
  const presentationSkillRoot = resolve(pluginRoot, "skills", "presentation");
  const cli = resolve(brandSkillRoot, "scripts", "brand.ts");
  const lines = [
    "PRESENTATION RUNTIME ACTIVE (>>presentation detected)",
    `Brand Runtime: v${runtimeVersion}`,
    `Workspace reported by host: ${cwd}`,
    `Project hint: ${projectHint || "not provided"}.`,
    "Treat the workspace and --project as evidence. Confirm the exact target before project-wide inspection or writing when the target is not already established safely in the conversation.",
    `Presentation skill: ${presentationSkillRoot}/SKILL.md`,
    `Brand authority skill: ${brandSkillRoot}/SKILL.md`,
    "Read the Presentation skill first. Read the Brand skill before applying official identity, creating project design direction, or recording reusable knowledge.",
  ];

  if (!requested) {
    return [
      ...lines,
      "",
      "NO BRAND PACK EXPLICITLY SELECTED",
      "Do not auto-select a Brand Pack merely because it is the only installed pack; it may belong to another client.",
      "Inspect confirmed project authority and existing design direction. Use brand-pack only for a recorded semantic match; otherwise continue as brand-pending without claiming official identity.",
      `Pending context after project confirmation: node --experimental-strip-types "${cli}" context --mode brand-pending --surface presentation --project-root "<confirmed-project>"`,
    ].join("\n");
  }

  const bindingReview = bindingReviewContext(brandResolution);
  if (bindingReview) return [...lines, "", bindingReview].join("\n");
  if (brandResolution.status === "ambiguous") {
    return [...lines, "", ambiguousBrandContext(brandResolution)].join("\n");
  }
  if (!brandResolution.ok && brandResolution.status !== "brand-not-found") {
    return [
      ...lines,
      "",
      `The explicitly requested Brand Pack could not be loaded: ${requested}.`,
      `${brandResolution.reason} Current path: ${brandResolution.brandRoot || brandResolution.configuredBrandRoot || "not configured"}.`,
      "Ask for the absolute path to the downloaded folder named brand, then configure it with:",
      `node --experimental-strip-types "${cli}" config set --brand-root "<absolute-path-to-brand-folder>"`,
      "Stop official branded presentation work until configuration reports ready. Never substitute another pack.",
    ].join("\n");
  }

  const selectedRoot = resolve(brandResolution.brandRoot, requested);
  if (!isDirectory(selectedRoot)) {
    return [
      ...lines,
      "",
      `The explicitly requested Brand Pack is not installed: ${requested}.`,
      `Installed Brand Packs: ${(brandResolution.brands || []).join(", ") || "none"}.`,
      "Do not substitute another Brand Pack. Stop official branded presentation work until the requested pack is available or the user explicitly chooses brand-pending.",
    ].join("\n");
  }

  return [
    ...lines,
    "",
    `Use the Brand Pack at ${selectedRoot} (${packLabel(selectedRoot)}).`,
    `node --experimental-strip-types "${cli}" status --brand ${requested} --brand-root "${brandResolution.brandRoot}"`,
    `node --experimental-strip-types "${cli}" validate --brand ${requested} --brand-root "${brandResolution.brandRoot}"`,
    `node --experimental-strip-types "${cli}" context --mode brand-pack --brand ${requested} --surface presentation --brand-root "${brandResolution.brandRoot}" --project-root "<confirmed-project>"`,
    "Stop if Brand Pack validation or semantic matching fails.",
  ].join("\n");
}

function main() {
  const input = readInput();
  const prompt = typeof input.prompt === "string" ? input.prompt : "";
  if (!/(?:^|\s)>>(?:brand|presentation)(?=\s|$)/iu.test(prompt)) return;

  const cwd = typeof input.cwd === "string" && input.cwd
    ? input.cwd
    : process.env.CLAUDE_PROJECT_DIR || process.env.CODEX_PROJECT_DIR || process.cwd();
  const request = parseRuntimeRequest(prompt);
  const brandResolution = resolveBrandRoot({ cwd, brand: request.requested || undefined });
  const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

  const additionalContext = request.entry === "presentation"
    ? directPresentationActivation({
        cwd,
        pluginRoot,
        runtimeVersion: pluginVersion(pluginRoot),
        ...request,
        brandResolution,
      })
    : activationContext({
        cwd,
        pluginRoot,
        runtimeVersion: pluginVersion(pluginRoot),
        ...request,
        brandResolution,
      }) + (request.presentation ? presentationSkillContext(pluginRoot) : "");

  process.stdout.write(`${JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "UserPromptSubmit",
      additionalContext,
    },
  })}\n`);
}

main();
