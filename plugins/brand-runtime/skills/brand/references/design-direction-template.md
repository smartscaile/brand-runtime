# Project design direction template

Use this structure for `docs/design/design-direction.md`. Keep the document concise, specific, and actionable. Remove prompts and sections that do not apply.

```markdown
---
brand: <slug>
brand_version: <version>
brand_rules_revision: <revision>
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

### Sourced from the Brand Pack

- Identity rules:
- Voice rules:
- Declared assets:
- Required tokens:
- Active brand rules:

### Project decisions

- Decisions introduced for this surface:
- Explicit exceptions and approvals:
- Open questions:

### Project knowledge consulted

- Active project rules:
- Relevant learnings:
- Reused patterns and source projects:
- Adaptations made for this Brand Pack:

## Visual thesis

Describe in one or two sentences how this project should feel and the compositional idea that will create that perception. Use concrete visual language, not abstract adjectives alone.

## Composition system

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
```

## Authorship rules

- Copy facts from the Brand Pack accurately but summarize only what affects this project.
- Label every unsourced application choice as a project decision.
- Never add a new brand truth through this document.
- Do not turn a project preference into a lasting client rule unless the user explicitly requests it.
- When machine-readable tokens are necessary, create a project-local companion such as `docs/design/design-tokens.json` or the project's established token file and reference it from the direction.
- Update metadata when the Brand Pack version or brand-rules revision changes, then reconcile affected decisions instead of regenerating the document blindly.
