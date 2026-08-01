# Brand Runtime

A universal brand and interface director for validated private Brand Packs and explicitly provisional projects in Codex and Claude Code.

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

Start a new session after installation and invoke:

```text
>>brand <slug>
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

The plugin stores only that absolute folder path in the user's standard configuration directory. It rescans direct children on every invocation, so adding another Brand Pack later requires no reconfiguration. With one installed pack, `>>brand` may resolve it automatically; with multiple packs, use `>>brand <slug>`.

Activation reports three independent compatibility signals: the installed Brand Runtime version, the immutable Brand Pack version, and the client-owned brand-rules revision.

Native fallbacks are `$brand` in Codex and `/brand-runtime:brand` in Claude Code.

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

## Client-equivalent test

Test in a consumer workspace without a repo-local or user-authored fallback copy of the Brand skill. After installing or reinstalling the plugin, start a new session and invoke:

```text
>>brand <installed-slug>
```

The activation context must reference the skill inside the installed plugin cache, never `.ai/skills/brand` from the consumer workspace.

## Architecture

- `plugins/brand-runtime`: shared plugin distributed to both runtimes.
- `plugins/brand-runtime/skills/brand`: canonical source for the reusable workflow and Brand Pack validation CLI.
- `plugins/brand-runtime/hooks/hooks.json`: `>>brand` activation for supported hook runtimes.
- `.agents/plugins/marketplace.json`: Codex marketplace manifest.
- `.claude-plugin/marketplace.json`: Claude Code marketplace manifest.

The plugin never contains client identity or mutable project knowledge. Brand-specific tokens, assets, guidelines, and references live only in the separate `<brand-folder>/<slug>` Brand Pack. The plugin contributes an identity-neutral design foundation, a director workflow, and optional stack guidance that translate the selected pack into a project-local `docs/design/design-direction.md`.

Explicit learning is project-first. Rules, learnings, patterns, and their evidence live under `docs/design/` in the target project as structured Markdown. The `context` command reports the available project knowledge without loading unrelated entries. Only a normative rule explicitly confirmed for future projects of the selected brand is promoted to `<brand-folder>/<slug>/brand.rules.json`.

## Internal release check

Edit the Brand skill directly in `plugins/brand-runtime/skills/brand`, then validate the standalone repository before a release:

```bash
npm run check
```
