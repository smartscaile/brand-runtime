---
name: presentation
description: Create, restructure, refine, review, export, and package presentation decks using Brand Runtime identity authority and a deterministic HTML-first workflow with opt-in PDF generation. Use when the Presentation command or Brand presentation modifier is invoked, or for presentation, slide, slide deck, pitch deck, keynote, strategy deck, HTML deck, PDF deck, PowerPoint, PPTX, Google Slides, slide-by-slide refinement, visual hierarchy, copy comparison, presentation QA, or export repair.
---

# Presentation

Direct presentation work as a specialized surface of Brand Runtime. Own narrative structure, slide composition, iterative refinement, fixed-page HTML mechanics, opt-in PDF export, and rendered QA. Never own or invent client identity.

## Authority boundary

- Read `../brand/SKILL.md` before applying official identity, interpreting a Brand Pack, creating project design direction, learning a project pattern, or promoting a brand rule.
- Use `brand-pack` only after the Brand skill validates an explicitly selected, semantically matching Brand Pack.
- Use `brand-pending` when no official pack is selected. Keep identity-like choices provisional and project-local.
- Never bundle client colors, fonts, logos, voice, layouts, assets, or mutable preferences in this skill.
- Preserve the requested output format. Prefer validated fixed-page HTML as the default delivery. Generate and embed a PDF only when the request or command explicitly opts in with `--pdf`; use the native `Save PDF` browser flow otherwise. Use the available native presentation workflow when editable PPTX or Google Slides is the real requirement.
- Do not introduce React, Tailwind, a component library, or a build framework unless interaction, state, integration, or maintenance requirements justify it.

## Public entry points

Support both entry paths:

```text
>>presentation [--project <name-or-path>] [--brand <slug>] <request>
>>brand <slug> --presentation <request>
```

`>>presentation` selects this workflow directly. `--brand` requests official identity through the Brand skill; omitting it never authorizes automatic use of an unrelated installed pack. `>>brand ... --presentation` selects identity first and then delegates presentation mechanics here.

Treat `--project` as a discovery hint, not confirmation. Before a project-wide scan, project command, source loading, or write, confirm the exact project when the target cannot be established safely from the current conversation and workspace.

## Route the request

Choose one primary workflow:

1. **Create or restructure:** build the narrative and presentation system.
2. **Refine:** improve one slide or a selected range without destabilizing approved work.
3. **Review:** diagnose hierarchy, copy, evidence, consistency, or export readiness without writing unless requested.
4. **Export or repair:** produce and verify final HTML by default, with PDF, PPTX, or Google Slides only when explicitly requested.
5. **Learn:** record an explicitly reusable project rule or pattern through the Brand skill.

When a request combines these intents, preserve this order: inspect, resolve authority, lock content, design, implement, export, validate.

## Establish presentation state

Before changing a deck:

1. Read project-local instructions and the current design direction.
2. Inventory the source deck, approved slides, reference images, assets, data, and requested delivery format.
3. Render or inspect the actual artifact. Do not refine from source code alone when visual output exists.
4. Classify each relevant statement as source copy, proposed copy, or approved copy.
5. Identify the current slide system: canvas, margins, grid, type roles, chapter marker, footer, recurring components, imagery, and export path.
6. Distinguish a local defect from a system defect. Fix the system when the same issue affects multiple slides.

Read `references/copy-and-evidence.md` when copy, metrics, claims, translation, or source fidelity matters.

For every new fixed-page deck, maintain `presentation.spec.json` and `presentation.approvals.json` beside the authoring HTML. Keep ordered `data-slide-id`, `data-slide-job`, and `data-slide-family` metadata aligned with the spec. Existing decks without a contract stay explicitly `legacy-unverified` until deliberately migrated.

Read `references/quality-policy.md` before creating contracts, changing thresholds, interpreting findings, recording approvals, or freezing a delivery.

## Create or restructure

1. Resolve the audience, decision, presentation moment, delivery environment, and non-negotiable content.
2. Build an answer-first narrative. Give each slide one job, one governing idea, and one dominant visual relationship.
3. Define a small project-local slide grammar rather than a rigid template catalog.
4. Establish consistent page geometry before styling individual slides.
5. Select visual forms from meaning: comparison, sequence, hierarchy, evidence, transition, or decision.
6. Use authored SVG or HTML geometry for diagrams and charts when exact organization matters. Use generated or sourced raster imagery only when imagery materially advances the message.
7. Record presentation-specific decisions in the project design direction without converting them into brand rules.
8. Implement, render, and refine representative slides before scaling the full deck.

Read `references/visual-system.md` before substantial creation or redesign. For fixed-page HTML, start from `assets/html-starter/presentation.html` or run the bundled scaffold command described in `references/html-delivery.md`.

## Refine

Treat refinement as editorial design, not decoration.

1. Inspect the current rendered slide and its neighbors.
2. State the problem in relationship terms: hierarchy, density, rhythm, alignment, contrast, imagery, copy, evidence, or continuity.
3. Preserve approved copy and accepted elements unless the user explicitly reopens them.
4. If the intended change is clear, implement it directly.
5. If the choice is materially ambiguous, present up to three distinct directions:
   - **Conservative:** preserve the structure and correct craft.
   - **Editorial:** strengthen hierarchy and visual pacing.
   - **Structural:** change the visual model or information architecture.
6. Recommend one direction with a concrete reason. Do not show three cosmetic variations of the same layout.
7. Apply the selected direction to the target slide, then verify its relationship to the deck system.
8. Render again at full-slide and detail scale.

Read `references/refinement.md` for critique criteria, option framing, and anti-patterns.

## Export and package

For a fixed-page HTML deck:

- Keep authoring as a single self-contained HTML file or inline all dependencies before delivery.
- Include screen-only Previous, Next, page count, and Save PDF controls.
- Make keyboard navigation deterministic.
- Without an embedded payload, make Save PDF invoke the browser's native print/save dialog.
- When PDF is explicitly requested, download the finalized, validated bytes directly and label the control Download PDF.
- Keep slides at a fixed 16:9 canvas unless another ratio is explicitly required.
- Use print CSS that exposes every slide, removes controls, preserves backgrounds, and defines exact page size.
- Wait for fonts and final assets before export.
- Embed only a final validated PDF and only in the explicit PDF mode.

Read `references/html-delivery.md` before implementing or exporting HTML. Use Node.js 22.20.0 or newer and `scripts/presentation-runtime.mjs` for deterministic scaffold, export, packaging, and baseline QA.

## Export-safe visual rules

Inside printable slides, avoid renderer-fragile composition by default:

- no CSS or SVG blur filters;
- no `backdrop-filter`, `mix-blend-mode`, masks, or clipped soft effects;
- no large blurred shadows behind overlapping or absolutely positioned layers;
- no translucent gradient stack whose meaning depends on compositor behavior;
- no text shadow used to repair contrast;
- no remote fonts or assets in the final standalone HTML;
- no Type 3 PDF fonts;
- no recipient-side PDF regeneration library; HTML-first uses only the native print dialog and print CSS.

Prefer solid fills, deliberate borders, authored geometry, embedded TrueType/OpenType fonts, and rasterized effects when an effect is essential. A subtle screen effect may exist only with a print-safe fallback and rendered proof in the final PDF.

## Quality gate

Keep objective QA, explainable system diagnostics, and human authority separate. A technically valid deck is not visually approved. Block final delivery until all applicable checks pass:

- the v1 contract is valid, `briefStatus` is `ready`, and ordered slide metadata matches the rendered deck;
- project-declared family-run and eyebrow-ratio thresholds have no unresolved blocking finding;
- approved copy is unchanged or explicitly approved again;
- metrics and claims have visible provenance and consistent definitions;
- no authored element is clipped, masked, hidden, or unintentionally truncated;
- every slide has a clear reading order at presentation distance;
- page margins, chapter marker, metadata, and footer anchors remain consistent;
- repeated components use the same geometry unless the difference has a semantic purpose;
- HTML has no missing or remote assets and screen controls are excluded from print;
- when PDF is explicit, its page count and dimensions match the deck;
- when PDF is explicit, fonts are embedded and no unexpected Type 3 font exists;
- when PDF is explicit, the downloaded PDF hash matches the validated PDF;
- when PDF is explicit, every page is rendered to an image and visually inspected;
- representative pages are checked in at least two rendering paths when transparency, SVG, or complex layering is present.
- content and visual approvals are human-authored and current;
- freeze hashes match the current HTML, PDF, and presentation spec.

Only `deliveryState: frozen` represents a final contract-v1 delivery. `legacy-unverified`, `awaiting-*`, and `blocked` are not synonyms for completion. Never restore a generic `status: passed` field.

Read `references/quality-policy.md` for the contract and lifecycle, and `references/qa.md` for the complete rendered validation sequence.

## Commands

```bash
node <skill-dir>/scripts/presentation-runtime.mjs scaffold --output <project-dir> --title <title>
node <skill-dir>/scripts/presentation-runtime.mjs quality --input <authoring.html>
node <skill-dir>/scripts/presentation-runtime.mjs export --input <authoring.html> --html <shareable.html> --qa-dir <qa-dir>
node <skill-dir>/scripts/presentation-runtime.mjs export --input <authoring.html> --html <shareable.html> --qa-dir <qa-dir> --pdf <deck.pdf>
node <skill-dir>/scripts/presentation-runtime.mjs qa --input <authoring.html> --pdf <deck.pdf> --qa-dir <qa-dir>
```

The starter and script are delivery mechanics, not a visual identity or a finished presentation style.

## Reference routing

- Read `references/copy-and-evidence.md` for source fidelity, translations, metrics, or claim changes.
- Read `references/visual-system.md` for narrative architecture, layout grammar, hierarchy, imagery, charts, diagrams, or repeated presentation UI.
- Read `references/refinement.md` for slide-by-slide critique, alternative directions, or correction of an artificial/template-like result.
- Read `references/quality-policy.md` for contract v1, thresholds, findings, approvals, lifecycle, freeze, or legacy migration.
- Read `references/html-delivery.md` for fixed-page HTML, Save PDF, opt-in direct PDF download, self-contained packaging, or renderer-safe implementation.
- Read `references/qa.md` for export validation, PDF inspection, multi-render checks, or delivery repair.
