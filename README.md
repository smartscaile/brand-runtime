# Brand Runtime

A universal plugin for applying private Brand Packs from one client-owned library in Codex and Claude Code.

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

On first use, if the plugin cannot find a project-local `brand/` folder or a saved user configuration, it asks for the absolute path to the folder named `brand` downloaded from Brand Portal. Configure the containing folder, not one Brand Pack:

```text
/absolute/client-library/brand
├── example-brand/
└── another-brand/
```

The plugin stores only that absolute folder path in the user's standard configuration directory. It rescans direct children on every invocation, so adding another Brand Pack later requires no reconfiguration. With one installed pack, `>>brand` may resolve it automatically; with multiple packs, use `>>brand <slug>`.

Activation reports three independent compatibility signals: the installed Brand Runtime version, the immutable Brand Pack version, and the client-owned rules revision.

Native fallbacks are `$brand` in Codex and `/brand-runtime:brand` in Claude Code.

## Update in Codex

Refresh the configured marketplace snapshot, reinstall the plugin from that snapshot, and start a new thread:

```bash
codex plugin marketplace upgrade smartscaile
codex plugin add brand-runtime@smartscaile
```

Plugin updates replace the cached universal runtime. They do not modify client-owned `brand.rules.json`, `references/feedback/`, or the saved brand folder path.

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

Then run `/reload-plugins` in the active Claude Code session or start a new session. Updating Brand Runtime never modifies Brand Packs, the saved brand folder path, or client-owned rules.

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

The plugin never contains client identity. Brand-specific tokens, assets, guidelines, and references live only in the separate `<brand-folder>/<slug>` Brand Pack. The plugin contributes only an identity-neutral design foundation and a workflow that translates the selected pack into a project-local `docs/design/design-direction.md`. Explicit lasting feedback is stored in `<brand-folder>/<slug>/brand.rules.json` and becomes available immediately through the plugin's `context` command; it never requires a plugin release.

## Internal release check

Edit the Brand skill directly in `plugins/brand-runtime/skills/brand`, then validate the standalone repository before a release:

```bash
npm run check
```
