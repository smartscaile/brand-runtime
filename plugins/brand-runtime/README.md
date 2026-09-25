# Brand Runtime

Universal Brand Runtime for Codex, Claude Code, and Hermes. Use validated Brand Packs for official identity or an explicitly provisional `brand-pending` direction while a project has no pack.

Published by **smartscaile.**

## Hermes managed installation

```bash
hermes plugins install smartscaile/brand-runtime/plugins/brand-runtime --force --enable
hermes plugins doctor brand-runtime --ci
```

Use `--force` only with this approved Smartscaile source. Hermes installs the package as a profile-scoped regular directory. Run the same install command to replace an earlier managed version, then start a new session.

Without `--ref`, the command installs the current official source. Add `--ref <SHA-40>` only for an explicitly immutable audited installation.

## Runtime entry points

- Shared command: `>>brand <slug>`
- Project onboarding: `>>brand start [--project <name-or-path>] [--brand <slug>]`
- Presentation workflow: `>>presentation [--project <name-or-path>] [--brand <slug>] <request>`
- Brand-first presentation workflow: `>>brand <slug> --presentation <request>`
- Runtime update: `>>brand <slug> update Brand Runtime`
- Codex native fallback: `$brand`
- Codex presentation fallback: `$presentation`
- Claude Code native fallback: `/brand-runtime:brand`
- Claude Code presentation fallback: `/brand-runtime:presentation`
- Hermes portable skills: inspect their qualified names with the agent tool `skills_list` after starting a new session.

The plugin owns Brand Pack application, provisional project direction, deliverable discovery, stack guidance, explicit project learning, brand-rule promotion, and host-native Brand Runtime updates. Its deterministic CLI provides `config`, `status`, `validate`, `context`, and `learn`. Client-specific identity, tokens, references, assets, and mutable project knowledge are never bundled into this plugin.

The bundled Presentation skill owns presentation narrative, slide-by-slide refinement, identity-neutral HTML-first mechanics, opt-in PDF export, export-safe composition rules, and rendered QA. `>>presentation` activates it directly in hook-capable hosts. `--brand <slug>` delegates identity to the Brand skill, while an omitted brand remains project-resolved or explicitly `brand-pending`. Installing Brand Runtime installs both skills together.

The universal skill includes an identity-neutral design foundation for hierarchy, spacing relationships, content containment, responsive behavior, interaction, and visual QA. It never supplies brand identity. For project creation or substantial redesign, the skill translates the validated Brand Pack into `docs/design/design-direction.md`, keeping sourced brand truth separate from project-owned application decisions.

Project start treats the host workspace and `--project` as discovery hints. It proposes a concrete project name and absolute path, requires user confirmation, and only then audits that project's existing instructions, stack, content, identity status, and design documentation. It does not require a particular client folder layout or a Brand Pack merely to begin. An omitted `--brand` never auto-selects another client's installed pack; a project without official identity continues inside Brand Runtime as `brand-pending`.

On the first `>>brand` invocation, the hook asks for a canonical `brand` folder when none is configured. `config add --brand-root <absolute-brand-folder>` extends the shared user library without dropping earlier roots; `config set` replaces it explicitly. Direct children are discovered dynamically, without copying Packs into profiles. Select `>>brand <slug>` when multiple packs exist; duplicate slugs require explicit root selection. Managed plugin installation remains profile-scoped.

`brand.source.json` and generated artifacts are immutable pack data. Preserve the target project's existing design registry, including JSON; the Markdown layout under `docs/design/` is a fallback for new knowledge, not a migration requirement. `context.projectKnowledge.existingSources` lists bounded local entrypoints, not a complete UI inventory or approval record. Start from the actual rendered UI and reuse, evolve or compose according to its function. Compatible local direction precedes universal composition guidance without overriding official identity. `brand.rules.json` remains the separate client-owned incremental layer for only those normative rules explicitly promoted to all future projects of that brand.

Plugin hooks must be reviewed and trusted before `>>brand` or `>>presentation` can inject activation context in Codex or Claude Code. Hermes Agent Plugins v1 loads the two skills through its namespaced skill index and does not execute `hooks/hooks.json`.

For a duplicate slug, `config bind --brand <slug> --brand-root <absolute-brand-folder>` records the user's official global root among registered folders, preserving historical files in place. Invalid or stale bindings fail closed; explicit, environment and project-local roots retain their precedence. Binding is not Pack validation or human approval.
