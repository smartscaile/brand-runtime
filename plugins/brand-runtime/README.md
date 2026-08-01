# Brand Runtime

Universal Brand Runtime for Codex and Claude Code. Use validated Brand Packs for official identity or an explicitly provisional `brand-pending` direction while a project has no pack.

Published by **smartscaile.**

## Runtime entry points

- Shared command: `>>brand <slug>`
- Project onboarding: `>>brand start [--project <name-or-path>] [--brand <slug>]`
- Runtime update: `>>brand <slug> update Brand Runtime`
- Codex native fallback: `$brand`
- Claude Code native fallback: `/brand-runtime:brand`

The plugin owns Brand Pack application, provisional project direction, deliverable discovery, stack guidance, explicit project learning, brand-rule promotion, and host-native Brand Runtime updates. Its deterministic CLI provides `config`, `status`, `validate`, `context`, and `learn`. Client-specific identity, tokens, references, assets, and mutable project knowledge are never bundled into this plugin.

The universal skill includes an identity-neutral design foundation for hierarchy, spacing relationships, content containment, responsive behavior, interaction, and visual QA. It never supplies brand identity. For project creation or substantial redesign, the skill translates the validated Brand Pack into `docs/design/design-direction.md`, keeping sourced brand truth separate from project-owned application decisions.

Project start treats the host workspace and `--project` as discovery hints. It proposes a concrete project name and absolute path, requires user confirmation, and only then audits that project's existing instructions, stack, content, identity status, and design documentation. It does not require a particular client folder layout or a Brand Pack merely to begin. An omitted `--brand` never auto-selects another client's installed pack; a project without official identity continues inside Brand Runtime as `brand-pending`.

On the first `>>brand` invocation, the hook asks for the absolute path to the downloaded `brand` folder when no usable path is available. The saved configuration contains only that folder path. Direct children such as `brand/example-brand` and `brand/another-brand` are discovered dynamically, so a newly added Brand Pack needs no configuration update. When more than one pack is installed, invoke `>>brand <slug>`.

`brand.source.json` and generated artifacts are immutable pack data. Project rules, learnings, and patterns are structured Markdown under the target project's `docs/design/` tree. `brand.rules.json` remains the separate client-owned incremental layer for only those normative rules explicitly promoted to all future projects of that brand.

Plugin hooks must be reviewed and trusted before `>>brand` can inject activation context.
