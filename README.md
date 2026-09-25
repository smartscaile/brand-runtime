# Brand Runtime

A universal brand and interface director for validated private Brand Packs and explicitly provisional projects in Codex, Claude Code, and Hermes.

Published by **smartscaile.**

## Install in Codex

```bash
codex plugin marketplace add smartscaile/brand-runtime
codex plugin add brand-runtime@smartscaile
```

## Install in Claude Code

```bash
claude plugin marketplace add smartscaile/brand-runtime
claude plugin install brand-runtime@smartscaile
```

## Install in Hermes

```bash
hermes plugins install smartscaile/brand-runtime/plugins/brand-runtime --force --enable
hermes plugins doctor brand-runtime --ci
```

Hermes loads the portable `brand` and `presentation` skills under a deterministic plugin namespace. Start a new Hermes session and use the agent tool `skills_list` to inspect their qualified names. Agent Plugins v1 does not load the Codex/Claude hook adapter, so Hermes routes requests through its skill index rather than `hooks/hooks.json`.

`--force` acknowledges the reviewed scanner findings for this approved Smartscaile repository and also supports managed replacement during updates. Do not use it with an untrusted source. Hermes installs the plugin as a profile-scoped regular directory.

Without `--ref`, the managed command installs the current official source. Use `--ref <SHA-40>` only when an explicitly immutable audited installation is required; Hermes accepts a full 40-character commit SHA.

Start a new session after installation and invoke:

```text
>>brand <slug>
```

The same installation includes the Presentation skill. Invoke it directly:

```text
>>presentation --project <name-or-path> --brand <slug> refine slide 03
```

Or select identity first:

```text
>>brand <slug> --presentation create a 16:9 strategy deck
```

To prepare a project before branded work, invoke:

```text
>>brand start --project <name-or-path> --brand <slug>
```

`--project` is an optional discovery hint. `--brand` explicitly selects a Brand Pack; when it is omitted, Brand Runtime audits the confirmed project before choosing `brand-pack` or `brand-pending`. Brand Runtime uses the workspace reported by the host to propose a project, then asks the user to confirm its name and absolute path before inspecting or changing it. It accepts arbitrary client directory layouts and never assumes that the workspace root is the project.

`brand-pack` is required to apply or claim an official identity. `brand-pending` keeps Brand Runtime active for a project that has no official pack: direction and tokens remain provisional, project-local, and make no brand-compliance claim.

On first use, if the plugin cannot find a project-local `brand/` folder or a saved user configuration, it asks for the absolute path to the folder named `brand` downloaded from Brand Portal. Configure the containing folder, not one Brand Pack:

```text
/absolute/client-library/brand
├── example-brand/
└── another-brand/
```

The plugin stores canonical folder paths in the user's standard configuration directory, not Pack copies or a fixed slug inventory. Use `config add --brand-root <absolute-brand-folder>` to extend the shared library; `config set` explicitly replaces it. Direct children are discovered dynamically. Select `>>brand <slug>` when multiple packs exist; duplicate slugs require an explicit root. Profiles share this user library by default but each needs its own managed plugin installation.

Activation reports three independent compatibility signals: the installed Brand Runtime version, the immutable Brand Pack version, and the client-owned brand-rules revision.

To retain historical directories without ambiguous identity, select the official root explicitly with `config bind --brand <slug> --brand-root <absolute-brand-folder>`. The root must already be registered. This records a global selection only; it neither moves files nor overrides explicit, environment or project-local roots. A stale selection blocks rather than falling back to another copy.

Native fallbacks are `$brand` and `$presentation` in Codex, plus `/brand-runtime:brand` and `/brand-runtime:presentation` in Claude Code.

## Update in Codex

Refresh the configured marketplace snapshot, reinstall the plugin from that snapshot, and start a new thread:

```bash
codex plugin marketplace upgrade smartscaile
codex plugin add brand-runtime@smartscaile
```

Plugin updates replace the cached universal runtime. They do not modify brand-owned `brand.rules.json`, `references/feedback/`, project knowledge, or the saved brand folder path.

## Update in Claude Code

From an active Claude Code session, ask Brand Runtime to update itself:

```text
>>brand <installed-slug> update Brand Runtime
```

Brand Runtime refreshes the `smartscaile` marketplace, updates the installed plugin, verifies the version, and asks you to run `/reload-plugins`.

Alternatively, run the native commands in a terminal:

```bash
claude plugin marketplace update smartscaile
claude plugin update brand-runtime@smartscaile
```

Then run `/reload-plugins` in the active Claude Code session or start a new session. Updating Brand Runtime never modifies Brand Packs, the saved brand folder path, project knowledge, or brand rules.

## Update in Hermes

Reinstall the plugin subdirectory because `hermes plugins update` requires a `.git` directory inside the installed package, while managed subdirectory installs intentionally contain only the plugin package:

```bash
hermes plugins install smartscaile/brand-runtime/plugins/brand-runtime --force --enable
hermes plugins doctor brand-runtime --ci
hermes plugins show brand-runtime
```

Start a new Hermes session after the update so the skill index is rebuilt. Updating the plugin does not modify Brand Packs, the saved brand folder path, project knowledge, or brand rules.

## Client-equivalent test

Test in a consumer workspace without a repo-local or user-authored fallback copy of the Brand skill. After installing or reinstalling the plugin, start a new session and invoke:

```text
>>brand <installed-slug>
```

The activation context must reference the skill inside the installed plugin cache, never `.ai/skills/brand` from the consumer workspace.

## Architecture

- `plugins/brand-runtime`: shared plugin distributed to Codex, Claude Code, and Hermes.
- `plugins/brand-runtime/plugin.json`: portable Agent Plugins v1 manifest used by Hermes.
- `plugins/brand-runtime/skills/brand`: canonical source for the reusable workflow and Brand Pack validation CLI.
- `plugins/brand-runtime/skills/presentation`: canonical source for presentation creation, refinement, deterministic delivery, and rendered QA.
- `plugins/brand-runtime/hooks/hooks.json`: `>>brand` and `>>presentation` activation for supported hook runtimes.
- `.agents/plugins/marketplace.json`: Codex marketplace manifest.
- `.claude-plugin/marketplace.json`: Claude Code marketplace manifest.

The plugin never contains client identity or mutable project knowledge. Brand-specific tokens, assets, guidelines, and references live only in the separate `<brand-folder>/<slug>` Brand Pack. The plugin contributes an identity-neutral design foundation, a director workflow, and optional stack guidance that translate the selected pack into a project-local `docs/design/design-direction.md`.

Explicit learning is project-first. Preserve the project's existing design registry and format; use structured Markdown under `docs/design/` only when no owner exists. The `context` command reports conventional design entrypoints and available Markdown knowledge without loading project contents or inferring approval. Follow the project's own sources and rendered components rather than treating empty default folders as a blank UI. Official identity and active brand rules remain authoritative; compatible local direction precedes generic composition guidance. Only a normative rule explicitly confirmed for future projects of the selected brand is promoted to `<brand-folder>/<slug>/brand.rules.json`.

## Internal release check

Edit the Brand skill directly in `plugins/brand-runtime/skills/brand`, then validate the standalone repository before a release:

```bash
npm run check
```
