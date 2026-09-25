# Project design direction template

Use this structure only when a direction needs to be created or substantially revised. Preserve the project's existing owner and format. Keep the document concise, specific, and actionable; omit unaffected sections rather than filling a template for each refinement.

```markdown
---
mode: <brand-pack|brand-pending>
brand: <slug|null>
brand_version: <version|null>
brand_rules_revision: <revision|null>
identity_claim: <official|none>
provisional: <true|false>
surface: <site|product|presentation|document>
status: <draft|approved>
updated_at: <ISO-8601>
---

# Design direction

## Context

- Project:
- Audience:
- User goal:
- Business goal:
- Required perception:
- Constraints:

## Source boundary

### Official identity source

- Brand Pack or `none`:
- Identity and voice authority:
- Declared assets and tokens:
- Active brand rules:
- Foundation defaults used and project-local semantic extensions, without redefining identity:
- Provisional boundary when brand-pending:

### Project decisions

- Base existente: componentes ativos, estilos e estados pertinentes, com o escopo de aprovação ou rejeição conhecido:
- Decisão de reúso: reutilizar, evoluir ou compor, e o que permanece intacto:
- Decisions introduced for this surface:
- Component anatomy, responsive sizing, density and theme selection owned by this project:
- Explicit exceptions and approvals:
- Open questions:

### Project knowledge consulted

- Active project rules:
- Relevant learnings:
- Reused patterns and source projects:
- Adaptations made for this direction mode:

## Visual thesis

Describe in one or two sentences how this project should feel and the compositional idea that will create that perception. Use concrete visual language, not abstract adjectives alone.

## Mapa de conteúdo

Para cada unidade relevante: intenção ou afirmação, evidência ou conteúdo, relação dominante, densidade e restrições. Em UI, explicite tarefa, dados e estados; não transforme a tela em uma campanha.

## Perfil e decisão de composição

- Densidade, distribuição, simetria e continuidade, cada uma com motivo:
- Estruturas distintas consideradas, somente quando houver ambiguidade material:
- Entrada dominante, percurso de leitura ou ação e relação com vizinhos:
- Estrutura escolhida e justificativa:
- Recorte de validação, riscos e limites de autorização:

## Geometria e relações

- Content hierarchy:
- Grid and alignment:
- Page or canvas margin:
- Section gap:
- Component inset:
- Internal stack gap:
- Density and negative-space strategy:
- Responsive recomposition:

## Typography

- Display and heading roles:
- Body and functional roles:
- Data, labels, or annotations:
- Measure and wrapping rules:

## Color and surfaces

- Background and surface roles:
- Text hierarchy:
- Primary action:
- Accent usage:
- Borders, elevation, and states:

## Imagery and iconography

- Subject and narrative function:
- Crop, perspective, lighting, and grading:
- Asset mapping:
- Icon mapping:

## Motion and interaction

- Motion purpose:
- State transitions:
- Reduced-motion behavior:

## Stack and implementation

- Existing stack:
- Selected stack:
- Why it fits this deliverable:
- Alternatives considered and not selected:
- Components or libraries approved by the user:
- Animation owner and selected modules or plugins:
- Accessibility and performance implications:
- Fallbacks:

## Surface architecture

Describe the ordered compositions or screens. For each one, state its thesis, principal evidence or content, visual treatment, and action.

## Anti-patterns

List concrete treatments that would contradict this direction, including repetitive component anatomy or unsupported identity choices.

## Validation targets

- Required breakpoints or export sizes:
- Content and localization cases:
- Accessibility checks:
- Visual review criteria:

## Evidência de revisão

- Versão ou hash do artefato renderizado e capturas consultadas:
- Conjunto, superfície em tamanho real e detalhe:
- Breakpoints, estados e variantes observados:
- Achados de composição, correções e exceções:
- Verificação técnica, aprovação humana e limitações, separadamente:
```

## Authorship rules

- In `brand-pack`, copy facts from the Brand Pack accurately but summarize only what affects this project. Set `identity_claim: official` and `provisional: false`.
- In `brand-pending`, set brand provenance fields to `null`, `identity_claim: none`, and `provisional: true`. State that no official identity is represented.
- Label every unsourced application choice as a project decision.
- Never add a new brand truth through this document.
- Do not turn a project preference into a lasting client rule unless the user explicitly requests it.
- When machine-readable tokens are necessary, create a project-local companion such as `docs/design/design-tokens.json` or the project's established token file and reference it from the direction. Mark identity-like tokens provisional in `brand-pending`.
- Update metadata when the Brand Pack version or brand-rules revision changes, then reconcile affected decisions instead of regenerating the document blindly.
- When a Brand Pack becomes available for a `brand-pending` project, reconcile every provisional identity choice against it before changing the mode.
