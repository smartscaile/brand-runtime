# Project learning

Use project learning to retain explicit rules, contextual conclusions, and reusable patterns without changing the universal plugin or silently affecting another project.

## Storage model

Preserve o registro canônico existente, inclusive quando padrões e decisões vivem em JSON ou junto dos componentes. Não migre, duplique ou reclassifique esse conteúdo só para caber no layout do runtime. As entradas descobertas por `context` são pontos de partida; leia as instruções e os links do próprio projeto para localizar outras fontes.

Use o layout abaixo apenas quando o projeto ainda não tiver um dono para esse conhecimento e a criação estiver autorizada. Create only the directories required by accepted knowledge:

```text
docs/design/
├── design-direction.md
├── rules/
│   └── <id>.md
├── learnings/
│   └── <id>.md
├── patterns/
│   └── <id>.md
└── references/
    └── <evidence>
```

- Store a project constraint in `rules/`.
- Store contextual feedback, rationale, or a retrospective conclusion in `learnings/`.
- Store a reusable component, structure, interaction, or visual approach in `patterns/`.
- Store screenshots, recordings, code samples, or other evidence in `references/`.
- Do not create empty folders or placeholder files.

For new knowledge without an established owner, prefer Markdown for context, reasoning and evidence. Existing project registries keep their format and authority; do not create a parallel Markdown source over an existing JSON pattern registry. The `learn --scope project` CLI writes only its documented Markdown layout; when another canonical owner already exists, update that owner directly under its project workflow instead of invoking the CLI to create a duplicate.

## Authority

- Treat an active project rule as binding only inside its project and only when it remains compatible with the selected direction mode. Reconcile `brand-pending` knowledge when a Brand Pack arrives.
- Treat learnings and patterns as advisory evidence.
- Keep one-off deliverable changes in the implementation or design direction unless the user asks to remember them.
- Never promote project knowledge to the brand automatically.
- Use `brand.rules.json` only after explicit confirmation that a normative rule must apply to future projects of the selected brand.

## Entry contract

For the runtime's Markdown fallback, use one file per stable id. Preserve `created_at`, update `updated_at`, and deprecate obsolete knowledge instead of deleting history. An existing registry keeps its own entry contract.

```markdown
---
id: "editorial-hero"
kind: "pattern"
status: "active"
mode: "brand-pack"
brand: "example-brand"
brand_version: "1.0.0"
surfaces: ["site"]
source_project: "example-project"
created_at: "2026-08-01T12:00:00.000Z"
updated_at: "2026-08-01T12:00:00.000Z"
---

# Editorial hero

## Instruction

Describe the retained rule, conclusion, or pattern precisely.

## Feedback

Summarize the explicit user feedback that authorized retention.

## Rationale

Explain why it worked or why the constraint exists.

## Use when

State the conditions in which a pattern is appropriate.

## Avoid when

State the conditions in which a pattern should not be reused.

## Evidence

- `docs/design/references/example.png`
```

Require `Use when` and `Avoid when` for patterns. Omit sections that do not apply to rules or learnings.

## Cross-project reuse

Load another project's knowledge only when the user explicitly names or provides the source project or file. Never scan unrelated projects for preferences.

When reusing a pattern:

1. Read the source pattern and its evidence.
2. Validate that its purpose fits the current deliverable.
3. Check it against the current direction mode, Brand Pack when present, surface, content, stack, and constraints.
4. Adapt rather than copy its identity or implementation blindly.
5. Record the source project and source path in the target design direction.
6. Create a target-project pattern only when the user asks to retain the adaptation.

A reference to another project is provenance, not inheritance. The target project owns every adopted decision.

## Learning workflow

1. Confirm that the user wants the information retained.
2. Classify it as `rule`, `learning`, or `pattern`.
3. Resolve the narrowest applicable surfaces.
4. Review existing project files for overlap.
5. Update an existing semantic id rather than creating a duplicate.
6. Preserve evidence with its existing owner and use project-relative paths. Use `docs/design/references/` only for the Markdown fallback.
7. Re-read the resulting file and reconcile the design direction when the new knowledge changes an active decision.

When the intended scope is unclear, ask whether it is deliverable-only, project-level, or a lasting rule for the brand.

For `brand-pending`, store `mode: "brand-pending"`, `brand: null`, and `brand_version: null`. Keep the knowledge project-local and never promote it to brand scope until a real Brand Pack exists and the rule is explicitly re-evaluated.
