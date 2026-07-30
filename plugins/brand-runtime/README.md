# Brand Runtime

Universal Brand Runtime for Codex and Claude Code. Install this plugin once, then point it to the client-owned folder named `brand` downloaded from Brand Portal.

Published by **smartscaile.**

## Runtime entry points

- Shared command: `>>brand <slug>`
- Runtime update: `>>brand <slug> update Brand Runtime`
- Codex native fallback: `$brand`
- Claude Code native fallback: `/brand-runtime:brand`

The plugin owns Brand Pack application, explicit client learning, and host-native Brand Runtime updates. Its deterministic Brand Pack CLI provides `config`, `status`, `validate`, `context`, and `learn`. Client-specific identity, tokens, references, assets, and accepted feedback remain in `<brand-folder>/{slug}` and are never bundled into this plugin.

On the first `>>brand` invocation, the hook asks for the absolute path to the downloaded `brand` folder when no usable path is available. The saved configuration contains only that folder path. Direct children such as `brand/example-brand` and `brand/another-brand` are discovered dynamically, so a newly added Brand Pack needs no configuration update. When more than one pack is installed, invoke `>>brand <slug>`.

`brand.source.json` and generated artifacts are immutable pack data. `brand.rules.json` is the separate client-owned incremental layer: it records only explicit lasting feedback, has its own revision, and is loaded by surface on every branded task.

Plugin hooks must be reviewed and trusted before `>>brand` can inject activation context.
