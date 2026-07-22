---
name: brand
description: Apply and validate a Brand Pack from the client's configured brand folder before creating or reviewing branded websites, product interfaces, presentations, PDFs, documents, campaigns, or visual assets. Use when the Brand command is invoked, when a workspace or configured library contains Brand Packs, when the user names a brand, or whenever branded output must follow machine-readable tokens and guidelines exactly.
---

# Brand

Use the installed Brand Pack as the single source of truth for branded work. This skill is runtime-neutral: Codex, Claude Code, CI, and local scripts consume the same `<brand-folder>/{slug}` payload outside runtime-specific directories. The plugin owns the universal workflow; explicit client feedback is persisted only in the client-owned Brand Pack. Brand rules constrain identity and quality without prescribing a closed set of layouts.

## Invocation

- `>>brand <slug>`: use the named Brand Pack. The first token after `>>brand` is the slug; the remaining prompt is the work request.
- `>>brand`: resolve automatically only when exactly one Brand Pack exists in the resolved folder named `brand`.
- Never interpret normal request text as a slug when the command is invoked without one.

## Required sequence

1. Read `rules/general.json` completely.
2. Resolve the folder named `brand` from explicit CLI input, an environment override, a project-local folder, or the saved user configuration. Read `references/brand-root-config.json` when configuration is missing, invalid, or stale.
3. If no usable brand folder is resolved, ask the user for its absolute path, run `config set --brand-root <absolute-brand-folder>`, and stop branded work until it reports `ready`. Never ask the user to copy a Brand Pack into the current project.
4. Select the requested slug. Without a slug, continue only when the resolved brand folder contains exactly one Brand Pack; otherwise show the discovered slugs and ask the user to select one.
5. Resolve the current skill directory from the activation context, then run `node --experimental-strip-types <skill-dir>/scripts/brand.ts status --brand <slug>`.
6. Run the same command with `validate`. Stop on any failed check.
7. Load the declared files in this order:
   - `<brand-folder>/<slug>/brand.source.json`
   - `<brand-folder>/<slug>/tokens.json`
   - `<brand-folder>/<slug>/brand-guidelines.md`
   - `<brand-folder>/<slug>/build-manifest.json`
8. When present, read `<brand-folder>/<slug>/brand.rules.json` completely. It is the client-owned incremental rule layer.
9. Run `context --brand <slug> --surface <site|product|presentation|document>` and use both `rules` and `clientRules` as the implementation checklist.
10. For `document` or `presentation`, read `references/editorial-surface-guidelines.json` and compose from the content's semantic structure.
11. For HTML documents, choose continuous flow or a paginated page canvas from the intended reading and export experience. When paginated, derive the page geometry from the requested format or source aspect ratio instead of applying a universal fixed size.
12. Inventory the returned `iconography` and map declared icons to real actions, capabilities, statuses, definition blocks, and editorial notes before choosing decorative dividers or text-only markers.
13. Create or review the requested output without editing generated Brand Pack files.
14. For editorial surfaces, preserve the complete content and order globally, then paginate by meaning instead of copying source page breaks mechanically.
15. Re-run `validate`, render the relevant breakpoints/export format, and complete the target project's own checks before delivery.

## Commands

```bash
node --experimental-strip-types <skill-dir>/scripts/brand.ts config show
node --experimental-strip-types <skill-dir>/scripts/brand.ts config set --brand-root <absolute-path-to-brand-folder>
node --experimental-strip-types <skill-dir>/scripts/brand.ts status --brand <slug>
node --experimental-strip-types <skill-dir>/scripts/brand.ts validate --brand <slug>
node --experimental-strip-types <skill-dir>/scripts/brand.ts context --brand <slug> --surface site
node --experimental-strip-types <skill-dir>/scripts/brand.ts learn --brand <slug> --id <stable-id> --surface <surface> --instruction <rule> --feedback <summary>
```

The configured path is the folder named `brand`, not an individual Brand Pack. Its direct children are sibling packs such as `brand/example-brand` and `brand/another-brand`. Discovery happens on every command, so adding another valid sibling pack never requires a configuration update. If `--brand` is omitted, automatic resolution is allowed only when exactly one pack is discovered.

## Brand folder resolution

- Persist only the absolute path to the client-owned folder named `brand`; never persist a list of slugs.
- Keep the configuration outside the plugin cache. By default it lives in the user's standard configuration directory and can be isolated with `BRAND_RUNTIME_CONFIG`.
- Support `BRAND_RUNTIME_BRAND_ROOT` as an explicit environment override and a nearest project-local `brand/` folder as a portable project override.
- If a saved path disappears, explain that it is stale and ask for the new absolute path. Do not erase it silently and do not fall back to copying packs into the working directory.
- The `learn` command writes to the selected pack. If that external folder is outside the runtime's writable sandbox, request narrowly scoped write access for the configured brand folder instead of creating a second editable copy.

## Client learning

Treat learning as an explicit editorial action, not as automatic memory:

1. Apply one-off corrections only to the current deliverable.
2. When the user clearly says a preference is permanent, normalize it into a concise English instruction and record it with `learn`.
3. When permanence is ambiguous, ask whether the correction is deliverable-only or a lasting brand rule before writing.
4. Use a stable, semantic rule id; choose the narrowest applicable surface; preserve a short English feedback summary; and attach evidence only from `references/feedback/`.
5. Reuse an existing id to update or deprecate a rule. The CLI deduplicates unchanged input and increments the client rules revision only for a material change.
6. Re-run `validate` and `context` after learning so the accepted rule affects subsequent work immediately without a plugin update.

Read `references/client-rules-contract.json` before recording, replacing, deprecating, or reviewing learned rules. Never edit the plugin cache or copy client rules into this skill.

## Decision rules

- Technical truth comes from JSON and the build manifest. The HTML preview is a human reference, not an editable source.
- Brand-specific colors, fonts, logos, voice, content, and layout rules must never be copied into this skill.
- Client-specific learned rules belong only in `<brand-folder>/<slug>/brand.rules.json`; update that file through the deterministic `learn` command.
- Never scaffold, clone, rename, or synthesize a Brand Pack. New packs must come from the authorized Brand Portal/Vox workflow and be added as siblings inside the configured brand folder.
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
- `references/brand-root-config.json`: persistent folder configuration, discovery, precedence, and onboarding contract.
- `references/client-rules-contract.json`: schema, lifecycle, and persistence policy for explicit client feedback.
- `references/editorial-surface-guidelines.json`: flexible UI, optional page-canvas behavior, pagination, and visual QA guidance for documents and presentations.
- `tasks/brand-apply.json`: sequential execution workflow.
- `tasks/brand-learn.json`: explicit feedback-to-rule workflow.
- `checklists/brand-quality-gate.json`: blocking delivery checks.
