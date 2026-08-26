const PLUGIN_SCHEMA_V1 = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";

const PORTABLE_PLUGIN_FIELDS = new Set([
  "$schema",
  "name",
  "version",
  "description",
  "author",
  "homepage",
  "repository",
  "license",
  "keywords",
  "extensions",
]);

const PORTABLE_AUTHOR_FIELDS = new Set(["name", "email", "url"]);

const HERMES_MANAGED_UPDATE_COMMANDS = [
  "hermes plugins install smartscaile/brand-runtime/plugins/brand-runtime --force --enable",
  "hermes plugins doctor brand-runtime --ci",
  "hermes plugins show brand-runtime",
];

const HERMES_LINKED_VERIFICATION_COMMANDS = [
  "hermes plugins doctor brand-runtime --ci",
  "hermes plugins show brand-runtime",
];

const HERMES_RELOAD = "Start a new Hermes session so the updated skill index is loaded.";
const HERMES_MODE_WORKFLOW = "For Hermes, select managed installation or linked-source mode before running any update command.";
const NON_HERMES_UPDATE_WORKFLOW = "For non-Hermes hosts, if the user asked the agent to perform the update, run the host's agentCommands in order with the normal approval required for network and plugin installation changes.";
const HERMES_MANAGED_UPDATE_WORKFLOW = "For a managed Hermes installation, if the user asked the agent to perform the update, run runtimes.hermes.managedSource.agentCommands in order with the normal approval required for network and plugin installation changes.";
const HERMES_LINKED_UPDATE_WORKFLOW = "For a linked-source Hermes installation, never run managedSource.agentCommands; update the canonical source repository through its approved workflow, preserve the link, then run linkedSource.verificationCommands.";
const HERMES_LINK_GUARDRAIL = "For Hermes, never run the managed reinstall when the installed Brand Runtime path is a symbolic link; preserve the link and update only its canonical source repository.";

function expect(value, message) {
  if (!value) throw new Error(message);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function expectExactArray(actual, expected, message) {
  expect(Array.isArray(actual), `${message} must be an array.`);
  expect(
    actual.length === expected.length && actual.every((value, index) => value === expected[index]),
    `${message} does not match the canonical sequence.`,
  );
}

export function validatePortablePluginManifest(manifest) {
  expect(isRecord(manifest), "Portable plugin manifest must be an object.");

  for (const field of Object.keys(manifest)) {
    expect(PORTABLE_PLUGIN_FIELDS.has(field), `Portable plugin manifest has unknown top-level field: ${field}.`);
  }

  expect(manifest.$schema === PLUGIN_SCHEMA_V1, "Portable plugin must target Agent Plugins v1.");
  expect(typeof manifest.name === "string", "Portable plugin name must be a string.");
  expect(manifest.name.length >= 1 && manifest.name.length <= 64, "Portable plugin name must contain 1 to 64 characters.");
  expect(/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(manifest.name), "Portable plugin name has invalid characters or boundaries.");
  expect(!manifest.name.includes("--") && !manifest.name.includes(".."), "Portable plugin name cannot contain repeated separators.");

  for (const field of ["version", "description", "homepage", "repository", "license"]) {
    if (field in manifest) {
      expect(typeof manifest[field] === "string", `Portable plugin ${field} must be a string.`);
    }
  }

  if ("author" in manifest) {
    expect(isRecord(manifest.author), "Portable plugin author must be an object.");
    for (const field of Object.keys(manifest.author)) {
      expect(PORTABLE_AUTHOR_FIELDS.has(field), `Portable plugin manifest has unknown author field: ${field}.`);
      expect(typeof manifest.author[field] === "string", `Portable plugin author.${field} must be a string.`);
    }
  }

  if ("keywords" in manifest) {
    expect(Array.isArray(manifest.keywords), "Portable plugin keywords must be an array.");
    expect(manifest.keywords.every((keyword) => typeof keyword === "string"), "Portable plugin keywords must contain only strings.");
  }

  if ("extensions" in manifest) {
    expect(isRecord(manifest.extensions), "Portable plugin extensions must be an object.");
    for (const [namespace, value] of Object.entries(manifest.extensions)) {
      expect(isRecord(value), `Portable plugin extension ${namespace} must be an object.`);
    }
  }
}

export function validateHermesRuntimeUpdate(contract) {
  expect(isRecord(contract), "Runtime update contract must be an object.");
  const hermes = contract.runtimes?.hermes;
  expect(isRecord(hermes), "Runtime update contract must define Hermes.");
  expect(!("agentCommands" in hermes), "Hermes runtime update must not define unconditional agentCommands.");

  expect(isRecord(hermes.managedSource), "Hermes runtime update must define managed-source behavior.");
  expectExactArray(hermes.managedSource.agentCommands, HERMES_MANAGED_UPDATE_COMMANDS, "Hermes managed update commands");
  expectExactArray(hermes.reload, [HERMES_RELOAD], "Hermes reload instructions");

  expect(isRecord(hermes.linkedSource), "Hermes runtime update must define linked-source behavior.");
  expect(
    typeof hermes.linkedSource.detection === "string" && hermes.linkedSource.detection.includes("symbolic link"),
    "Hermes linked-source detection must check for a symbolic link.",
  );
  expect(
    typeof hermes.linkedSource.action === "string"
      && hermes.linkedSource.action.includes("do not run the managed reinstall")
      && hermes.linkedSource.action.includes("preserve the link"),
    "Hermes linked-source action must preserve the link and skip managed reinstall.",
  );
  expectExactArray(
    hermes.linkedSource.verificationCommands,
    HERMES_LINKED_VERIFICATION_COMMANDS,
    "Hermes linked-source verification commands",
  );

  expect(Array.isArray(contract.workflow) && contract.workflow.includes(HERMES_MODE_WORKFLOW), "Runtime update workflow must select the Hermes installation mode.");
  expect(contract.workflow.includes(NON_HERMES_UPDATE_WORKFLOW), "Runtime update workflow must dispatch non-Hermes commands separately.");
  expect(contract.workflow.includes(HERMES_MANAGED_UPDATE_WORKFLOW), "Runtime update workflow must dispatch managed Hermes commands conditionally.");
  expect(contract.workflow.includes(HERMES_LINKED_UPDATE_WORKFLOW), "Runtime update workflow must protect linked Hermes sources conditionally.");
  expect(Array.isArray(contract.guardrails) && contract.guardrails.includes(HERMES_LINK_GUARDRAIL), "Runtime update guardrails must protect linked Hermes sources.");
}
