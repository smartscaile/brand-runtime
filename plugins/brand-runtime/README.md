# Brand Runtime

Universal Brand Runtime for Codex and Claude Code. Install this plugin once, then install the private Brand Pack required by each project.

Published by **smartscaile.**

## Runtime entry points

- Shared command: `>>brand <slug>`
- Codex native fallback: `$brand`
- Claude Code native fallback: `/brand-runtime:brand`

The plugin owns the reusable workflow and validation CLI. Client-specific identity, tokens, references, and assets remain in `brand/{slug}` and are never bundled into this plugin.

Plugin hooks must be reviewed and trusted before `>>brand` can inject activation context.
