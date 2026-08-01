---
name: brand
description: Apply and validate external Brand Packs, translate a selected pack into a project-local design direction, review branded output, manage explicit client-owned brand rules, or update Brand Runtime. Use when the Brand command is invoked, a user names a brand, a project requires a Brand Pack, or branded output must follow verified identity and design rules.
---

# Brand

Use a validated, client-owned Brand Pack as the only source of brand identity. The plugin is universal: it may define workflow, structural design foundations, and quality checks, but it must never contain a client's colors, fonts, logos, voice, strategy, layout style, or learned preferences.

## Non-negotiable boundaries

- Require a usable Brand Pack for every branded task. The universal foundation cannot replace, infer, clone, or synthesize one.
- Keep Brand Packs outside runtime-specific directories as direct children of one configured folder named `brand`.
- Treat `brand.source.json`, `tokens.json`, `brand-guidelines.md`, `build-manifest.json`, declared assets, and pack references as immutable.
- Persist explicit lasting feedback only through `learn` into the selected pack's `brand.rules.json`.
- Keep project-specific application decisions in the target project, not in the plugin or Brand Pack.
- Prefer semantic tokens and declared assets. Report a conflict instead of inventing missing identity.

## Resolve the request

Choose one workflow from the user's intent:

1. **Apply or review a brand:** follow Brand application.
2. **Record lasting feedback:** follow Client learning.
3. **Update Brand Runtime:** follow Runtime update and do not load or modify Brand Pack content.

`>>brand <slug>` selects the first token after the command as the Brand Pack slug. Without a slug, continue only when exactly one pack is discovered. Never interpret normal request text as a slug.

## Brand application

### 1. Resolve and validate

Resolve the folder named `brand` from explicit input, an environment override, the nearest project-local folder, or saved user configuration. Read `references/brand-root-config.json` only when configuration is missing, invalid, ambiguous, or stale.

Run:

```bash
node --experimental-strip-types <skill-dir>/scripts/brand.ts status --brand <slug>
node --experimental-strip-types <skill-dir>/scripts/brand.ts validate --brand <slug>
```

Confirm that the selected pack represents the brand of the requested deliverable. A technically valid pack is still unusable when the project or user identifies a different client, product, or brand owner. Stop and request the correct authorized pack instead of borrowing identity from another brand.

Stop when the pack is missing, ambiguous, incomplete, invalid, or semantically mismatched. If configuration is missing or stale, ask for the absolute path to the downloaded folder named `brand`, run `config set`, and stop branded work until it reports `ready`. Never ask the user to copy or recreate a pack.

### 2. Load only relevant context

Read `references/design-foundation.md`, then run:

```bash
node --experimental-strip-types <skill-dir>/scripts/brand.ts context --brand <slug> --surface <site|product|presentation|document>
```

Use the returned surface rules, active client rules, identity, voice, semantic tokens, assets, and iconography as the implementation context. The CLI already validates pack files and hashes; do not load every source file into context by default. Read a full pack source or guideline only when the returned context is insufficient or a conflict must be resolved.

Resolve instructions in this order:

1. active client rules returned by `context`;
2. immutable Brand Pack source, surface rules, tokens, guidelines, and declared assets;
3. universal design foundation;
4. project-owned application decisions.

An active client rule may intentionally override an immutable pack value without rewriting the pack. Apply the override only when it supplies enough information for the requested use. When an override conflicts with the pack but leaves semantic roles, assets, states, or other required details unresolved, stop and request clarification instead of inventing the missing mapping. Record every resolved override or approved project exception in the design direction.

For surface-specific composition and QA, read `references/surface-guidelines.md`.

### 3. Create the project design direction

For a project-based creation or substantial redesign, create or update `docs/design/design-direction.md` before implementation. Use `references/design-direction-template.md`.

The design direction is the application layer between Brand Pack and deliverable. It must:

- identify the selected pack, pack version, client-rules revision, surface, and source project;
- preserve declared identity instead of redefining it;
- translate brand rules into a concrete visual thesis for this project;
- define layout relationships, typographic roles, color roles, imagery, iconography, motion, composition, and explicit anti-patterns;
- separate sourced brand truth from project decisions and implementation notes;
- use project-local machine-readable tokens only when the implementation needs them;
- remain inside the target project and never be learned back into the Brand Pack automatically.

If the file already exists, read it first and update only the decisions affected by the request. Do not overwrite approved project decisions silently. For a one-off artifact without a project workspace, keep the same reasoning in the working context rather than creating an unrelated file.

### 4. Compose from content and intent

Build a relationship map before implementation:

- page or canvas margin;
- section gap;
- component inset;
- internal stack gap.

Map each relationship to declared pack tokens. Use the design direction to decide composition, density, imagery, and emphasis. Do not turn a Brand Pack into a fixed template catalog or repeat one component anatomy across every section.

Inventory declared iconography before drawing or importing icons. Use an icon only for a real action, capability, status, category, or relationship. Create an output-local extension only with explicit user authorization and enough declared construction guidance to preserve the family.

### 5. Validate the result

Re-run pack validation, the target project's checks, and rendered visual QA after fonts load. Delivery is blocked when any applicable condition fails:

- identity, assets, copy, or active client rules diverge from the selected pack;
- project direction contradicts sourced brand truth without an explicit approved exception;
- layout relationships use arbitrary one-off values instead of the mapped spacing system;
- authored content is clipped, masked, hidden, or unintentionally truncated;
- text or child bounds overflow a container, or wrapping consumes its bottom or trailing inset;
- hierarchy, contrast, focus, or interaction states are unclear at a required breakpoint;
- cards, dividers, badges, gradients, effects, or motion are decorative defaults without a semantic job;
- the output feels mechanically repetitive instead of expressing the project's visual thesis;
- document or presentation pagination separates related content or produces an invalid export.

## Client learning

Treat learning as an explicit editorial action:

1. Apply one-off feedback only to the current deliverable or project design direction.
2. When the user explicitly requests a permanent rule, read `references/client-rules-contract.json`.
3. When permanence is ambiguous, ask whether it is project-only or a lasting brand preference.
4. Normalize the rule into a stable semantic id, concise English instruction, narrowest surfaces, severity, and short feedback summary.
5. Review existing rules for overlap, then run `learn`; never edit `brand.rules.json` manually.
6. Re-run `validate` and `context` for the affected surface.

```bash
node --experimental-strip-types <skill-dir>/scripts/brand.ts learn --brand <slug> --id <id> --surface <surface> --instruction <rule> --feedback <summary>
```

## Runtime update

When the user asks to update or upgrade Brand Runtime, read `references/runtime-update.json` and follow its host-specific sequence. Runtime and Brand Pack versions are independent. Never modify packs, client rules, feedback evidence, or saved brand paths during a runtime update. State the required reload or new-session boundary after verification.

## CLI

```bash
node --experimental-strip-types <skill-dir>/scripts/brand.ts config show
node --experimental-strip-types <skill-dir>/scripts/brand.ts config set --brand-root <absolute-brand-folder>
node --experimental-strip-types <skill-dir>/scripts/brand.ts status --brand <slug>
node --experimental-strip-types <skill-dir>/scripts/brand.ts validate --brand <slug>
node --experimental-strip-types <skill-dir>/scripts/brand.ts context --brand <slug> --surface <site|product|presentation|document>
node --experimental-strip-types <skill-dir>/scripts/brand.ts learn --brand <slug> --id <id> --surface <surface> --instruction <rule> --feedback <summary>
```

## Reference routing

- Read `references/brand-pack-contract.json` when reviewing pack structure, ownership, or immutability.
- Read `references/brand-root-config.json` for configuration, discovery, or onboarding problems.
- Read `references/client-rules-contract.json` before learning, updating, deprecating, or reviewing lasting client rules.
- Read `references/design-foundation.md` for every branded creation or visual review.
- Read `references/design-direction-template.md` when creating or updating a project design direction.
- Read `references/surface-guidelines.md` for the selected output surface.
- Read `references/runtime-update.json` only for Brand Runtime installation or update work.
