---
name: brand
description: Apply and validate a project-scoped Brand Pack before creating or reviewing branded websites, product interfaces, presentations, PDFs, documents, campaigns, or visual assets. Use when the Brand command is invoked, when a project contains `brand/*`, when the user names a brand, or whenever branded output must follow machine-readable tokens and guidelines exactly.
---

# Brand

Use the installed Brand Pack as the single source of truth for branded work. This skill is runtime-neutral: Codex, Claude Code, CI, and local scripts consume the same `brand/{slug}` payload outside runtime-specific directories. Brand rules constrain identity and quality; they do not prescribe a closed set of layouts.

## Invocation

- `>>brand <slug>`: use the named Brand Pack. The first token after `>>brand` is the slug; the remaining prompt is the work request.
- `>>brand`: resolve automatically only when exactly one directory exists in `brand/`.
- Never interpret normal request text as a slug when the command is invoked without one.

## Required sequence

1. Read `rules/general.json` completely.
2. Locate the project root and inspect `brand/`.
3. Resolve the current skill directory from the activation context, then run `node --experimental-strip-types <skill-dir>/scripts/brand.ts status --brand <slug>`.
4. Run the same command with `validate`. Stop on any failed check.
5. Load the declared files in this order:
   - `brand/<slug>/brand.source.json`
   - `brand/<slug>/tokens.json`
   - `brand/<slug>/brand-guidelines.md`
   - `brand/<slug>/build-manifest.json`
6. Run `context --brand <slug> --surface <site|product|presentation|document>` and use the returned surface rules as an implementation checklist.
7. For `document` or `presentation`, read `references/editorial-surface-guidelines.json` and compose from the content's semantic structure.
8. For HTML documents, choose continuous flow or a paginated page canvas from the intended reading and export experience. When paginated, derive the page geometry from the requested format or source aspect ratio instead of applying a universal fixed size.
9. Inventory the returned `iconography` and map declared icons to real actions, capabilities, statuses, definition blocks, and editorial notes before choosing decorative dividers or text-only markers.
10. Create or review the requested output without editing generated Brand Pack files.
11. For editorial surfaces, preserve the complete content and order globally, then paginate by meaning instead of copying source page breaks mechanically.
12. Re-run `validate`, render the relevant breakpoints/export format, and complete the target project's own checks before delivery.

## Commands

```bash
node --experimental-strip-types <skill-dir>/scripts/brand.ts status --brand <slug>
node --experimental-strip-types <skill-dir>/scripts/brand.ts validate --brand <slug>
node --experimental-strip-types <skill-dir>/scripts/brand.ts context --brand <slug> --surface site
```

If `--brand` is omitted, automatic resolution is allowed only when exactly one brand directory exists.

## Decision rules

- Technical truth comes from JSON and the build manifest. The HTML preview is a human reference, not an editable source.
- Brand-specific colors, fonts, logos, voice, content, and layout rules must never be copied into this skill.
- Prefer semantic token roles over primitive color values when building UI.
- Use only declared assets and preserve their proportions and intended theme.
- Reuse semantically matching declared icons before drawing generic leader lines, initials, or decorative markers.
- Create output-local icon extensions only when the user explicitly authorizes them and the pack declares enough construction guidance to preserve the icon family; never write the extension into the Brand Pack.
- If a requested treatment conflicts with the pack, report the conflict instead of silently inventing an exception.
- Never edit `tokens.json`, `brand-guidelines.md`, `design-system.html`, or `build-manifest.json` manually.
- Do not continue when versions, slugs, artifact hashes, or asset hashes diverge.
- Treat layout patterns as starting points, not a closed catalog. Choose composition, grid, grouping, and emphasis according to the material.
- Give cards, dividers, and callouts a semantic job. Do not default to a rounded surface with a colored left rule when an icon, typographic statement, data treatment, or plain editorial note communicates the role more clearly.
- Use a centered page canvas only when page rhythm, print preview, or fixed-page export is part of the requested experience. Keep continuous reports and articles in natural document flow when pagination adds no value.
- For paginated HTML, derive shared page width and height from the target format, keep the on-screen sheet and `@page` geometry aligned, treat workspace gaps and shadows as screen-only chrome, and collapse to a fluid shadowless mobile layout unless a fixed-page preview is explicitly required.
- For documents and presentations, keep headings with their first content block, avoid awkward splits, and rebalance pages when export reveals orphaned or crowded content.

## Reference map

- `references/brand-pack-contract.json`: required payload structure and ownership.
- `references/editorial-surface-guidelines.json`: flexible UI, optional page-canvas behavior, pagination, and visual QA guidance for documents and presentations.
- `tasks/brand-apply.json`: sequential execution workflow.
- `checklists/brand-quality-gate.json`: blocking delivery checks.
