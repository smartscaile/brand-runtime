# Brand Runtime

A universal plugin for applying private, project-scoped Brand Packs in Codex and Claude Code.

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

Start a new session after installation. In a project containing `brand/<slug>`, invoke:

```text
>>brand <slug>
```

Native fallbacks are `$brand` in Codex and `/brand-runtime:brand` in Claude Code.

## Architecture

- `plugins/brand-runtime`: shared plugin distributed to both runtimes.
- `plugins/brand-runtime/skills/brand`: reusable workflow and Brand Pack validation CLI.
- `plugins/brand-runtime/hooks/hooks.json`: `>>brand` activation for supported hook runtimes.
- `.agents/plugins/marketplace.json`: Codex marketplace manifest.
- `.claude-plugin/marketplace.json`: Claude Code marketplace manifest.

The plugin never contains client identity. Brand-specific tokens, assets, guidelines, and references live only in the separate `brand/<slug>` Brand Pack.

## Internal release check

The publishable skill is synchronized from the canonical workspace skill before a release:

```bash
npm run skill:sync
npm run skill:check
npm run check
```

Set `BRAND_SKILL_SOURCE` when the canonical skill is not available at the default workspace-relative path.
