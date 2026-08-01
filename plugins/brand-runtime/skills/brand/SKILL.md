---
name: brand
description: Direct branded sites, products, presentations, and documents from a validated external Brand Pack; discover the deliverable, select an appropriate stack, create project-local design direction and learnings, review output, promote explicit lasting rules to the brand, or update Brand Runtime. Use when the Brand command is invoked, a brand is named, a project contains or depends on a Brand Pack, a user requests branded UI or an artifact, or branded output must be reviewed against verified identity and design rules.
---

# Brand

Act as a universal brand and interface director. Use a validated, client-owned Brand Pack as the only source of identity, then translate it into one project-specific direction. Define workflow, structural foundations, and quality checks here; never embed a client's colors, fonts, logos, voice, strategy, layout style, or learned preferences in the plugin.

## Non-negotiable boundaries

- Require a usable Brand Pack for every branded task. Never infer, clone, synthesize, or replace one with the universal foundation.
- Keep Brand Packs outside runtime-specific directories as direct children of one configured folder named `brand`.
- Treat `brand.source.json`, `tokens.json`, `brand-guidelines.md`, `build-manifest.json`, declared assets, and pack-managed references as immutable.
- Keep project decisions, rules, learnings, patterns, and evidence in the target project by default.
- Promote a rule to `brand.rules.json` only after the user explicitly confirms that it must apply to future projects of the selected brand.
- Never store mutable client or project knowledge in plugin source, plugin cache, or installed skill directories.
- Prefer semantic tokens and declared assets. Report a conflict instead of inventing missing identity.

## Route the request

Select one workflow from intent:

1. **Prepare a project:** follow Project start.
2. **Create, change, or review branded work:** follow Brand direction.
3. **Record feedback or a reusable pattern:** follow Project learning.
4. **Promote an accepted rule to the brand:** follow Brand rule promotion.
5. **Update Brand Runtime:** follow Runtime update without loading or modifying Brand Pack content.

`>>brand start [--project <name-or-path>] [--brand <slug>]` begins Project start. Treat `--project` as a location hint, never as proof that the project was selected. `>>brand <slug>` remains the compact form for selecting a Brand Pack in other workflows. Without a slug, continue only when exactly one pack is discovered. Never interpret `start`, an option, or normal request text as a slug.

## Project start

Use Project start to establish the target safely before auditing or preparing branded work.

### Step 1 — Detect a project candidate

Read the working directory or workspace reported by the host, but treat it only as evidence. The user may have opened the project itself, a monorepo, or a broader workspace containing several projects.

When `--project` is present, use its name or path only as a hint. Resolve it with the smallest useful read-only inspection. When it is absent, inspect the current boundary and nearby project markers to propose the most likely candidate. Accept arbitrary client directory layouts; never require `projects/`, a repository root, a particular manifest, or a configured project registry. Do not recursively scan unrelated workspaces, the user's home, or broad sibling trees.

### Step 2 — Confirm before inspection

Before a project-wide scan, project command, source or document loading, or any write, state the proposed project name and absolute path and ask the user to confirm that exact target. A host working directory and an explicit `--project` hint still require confirmation.

If no single candidate is clear, ask which project to use and accept a name, relative path, or absolute path. If several candidates match, present only the relevant matches. Stop until exactly one project is confirmed; never silently choose a directory or continue to Brand Pack checks.

### Step 3 — Audit the confirmed project

After confirmation, read project-local instructions first. Inspect the existing structure, deliverable, content, stack, design documentation, Brand Pack relationship, and applicable checks before proposing changes. Reuse valid existing direction and knowledge instead of recreating them. Ask only the unresolved questions that can materially change the work, then continue with Brand direction.

Project start is idempotent and preparatory. It does not install dependencies, replace the stack, rewrite source, or create design files unless the user also authorizes that work.

## Brand direction

### Step 1 — Resolve and validate the Brand Pack

Resolve the folder named `brand` from explicit input, an environment override, the nearest project-local folder, or saved user configuration. Read `references/brand-root-config.json` only when configuration is missing, invalid, ambiguous, or stale.

Run:

```bash
node --experimental-strip-types <skill-dir>/scripts/brand.ts status --brand <slug>
node --experimental-strip-types <skill-dir>/scripts/brand.ts validate --brand <slug>
```

Confirm that the selected pack represents the brand of the requested deliverable. A technically valid pack is still unusable when the project or user identifies a different client, product, or brand owner. Stop and request the correct authorized pack instead of borrowing identity from another brand.

Stop when the pack is missing, ambiguous, incomplete, invalid, or semantically mismatched. If configuration is missing or stale, ask for the absolute path to the downloaded folder named `brand`, run `config set`, and stop branded work until it reports `ready`. Never ask the user to copy or recreate a pack.

### Step 2 — Discover the deliverable

Inspect the existing project, content, instructions, references, and stack before asking questions. Resolve only the gaps that can materially change the result:

- deliverable and surface;
- audience, user goal, and business goal;
- required content, data, actions, and conversion path;
- delivery format, breakpoints, export, hosting, or integration constraints;
- required perception and concrete visual references;
- existing stack and component system;
- interaction, motion, accessibility, and performance needs;
- approval criteria and non-negotiable exclusions.

Ask concise questions only when the answer cannot be discovered and a reasonable assumption would change the direction. Do not make the user choose implementation details that can be derived safely.

### Step 3 — Load relevant brand and project context

Read `references/design-foundation.md`, then run:

```bash
node --experimental-strip-types <skill-dir>/scripts/brand.ts context --brand <slug> --surface <site|product|presentation|document> --project-root <project>
```

Use the returned surface rules, active brand rules, identity, voice, semantic tokens, assets, iconography, and project knowledge paths. Read only project rules and learnings relevant to the requested surface or decision. Read a full pack source or guideline only when the returned context is insufficient or a conflict must be resolved.

Resolve instructions in this order:

1. active brand rules returned by `context`;
2. immutable Brand Pack source, surface rules, tokens, guidelines, and declared assets;
3. universal design foundation;
4. project-owned direction, rules, and approved applications that remain compatible with the preceding sources.

When an active brand rule overrides an immutable pack value but leaves semantic roles, assets, states, or required mappings unresolved, stop and request clarification instead of inventing the missing identity.

Treat project learnings and patterns as advisory evidence, not automatic rules. Load knowledge from another project only when the user explicitly names or references that project. Never copy identity or silently inherit its decisions.

### Step 4 — Select the stack only when needed

Preserve a suitable existing stack. Never introduce React or a library merely to make an output look refined. Select technology from delivery constraints, state complexity, interaction behavior, maintenance, accessibility, performance, and the team's environment.

When the user requests component, animation, scroll, SVG, or 3D options, read `references/stack-selection.md`. Present a small curated shortlist with the purpose and tradeoffs of each option. Let the user inspect creative references before adopting them. Verify the current official documentation, exact dependencies, license, and project compatibility before installation.

Record the selected stack, reasons, rejected alternatives, motion ownership, dependencies, and fallbacks in the project design direction.

### Step 5 — Create the project design direction

For a project-based creation or substantial redesign, create or update `docs/design/design-direction.md` before implementation. Use `references/design-direction-template.md`.

Make the design direction:

- identify the selected pack, pack version, brand-rules revision, surface, and source project;
- preserve declared identity instead of redefining it;
- translate brand truth into one concrete visual and interaction thesis;
- define layout relationships, typographic roles, color roles, imagery, iconography, motion, composition, stack, and explicit anti-patterns;
- separate sourced brand truth, project decisions, referenced learnings, and implementation notes;
- use project-local machine-readable tokens only when implementation needs them;
- remain in the target project and never become a brand rule automatically.

Read an existing direction before updating it. Change only decisions affected by the request and never overwrite approved decisions silently. For a one-off artifact without a project workspace, keep the same reasoning in working context rather than creating an unrelated file.

### Step 6 — Compose and implement

Build a relationship map before implementation:

- page or canvas margin;
- section gap;
- component inset;
- internal stack gap.

Map each relationship to declared pack tokens. Use content, user intent, and the project thesis to decide hierarchy, density, imagery, and emphasis. Do not turn a Brand Pack into a template catalog or repeat one component anatomy across every section.

Inventory declared iconography before drawing or importing icons. Use an icon only for a real action, capability, status, category, or relationship. Create an output-local extension only with explicit authorization and enough declared construction guidance to preserve the family.

For surface-specific composition and QA, read `references/surface-guidelines.md`.

### Step 7 — Validate and refine

Re-run pack validation, target-project checks, and rendered visual QA after fonts and final assets load. Block delivery when any applicable condition fails:

- identity, assets, copy, or active brand rules diverge from the selected pack;
- project direction or project rules contradict sourced brand truth without an approved resolution;
- layout relationships use arbitrary one-off values instead of the mapped spacing system;
- authored content is clipped, masked, hidden, or unintentionally truncated;
- text or child bounds overflow a container, or wrapping consumes its bottom or trailing inset;
- hierarchy, contrast, focus, or interaction states are unclear at a required breakpoint;
- cards, dividers, badges, gradients, effects, libraries, or motion are decorative defaults without a semantic job;
- the output feels mechanically repetitive instead of expressing the project's thesis;
- document or presentation pagination separates related content or produces an invalid export.

## Project learning

Treat learning as an explicit editorial action and keep it project-local by default. Read `references/project-learning.md` before recording or reusing project knowledge.

Classify the request as:

- `rule`: a constraint for future work in this project;
- `learning`: contextual feedback or a conclusion worth retaining;
- `pattern`: a reusable component, structure, interaction, or visual approach with clear use and avoidance conditions.

When scope is ambiguous, ask whether the feedback applies only to the current deliverable, to this project, or to all future projects of the brand. Never learn from every correction automatically.

```bash
node --experimental-strip-types <skill-dir>/scripts/brand.ts learn --scope project --kind <rule|learning|pattern> --brand <slug> --project-root <project> --id <id> --title <title> --instruction <text> --feedback <summary> [--surface <surface>] [--use-when <text>] [--avoid-when <text>] [--evidence <project-relative-path>]
```

Keep one-off deliverable feedback in the current implementation or design direction. Create project knowledge files only when the user asks to remember, reuse, or record the decision.

## Brand rule promotion

Promote only a stable normative rule that the user explicitly wants applied to future projects of the selected brand. Read `references/client-rules-contract.json`, review existing rules for overlap, and use the CLI instead of editing `brand.rules.json` manually.

```bash
node --experimental-strip-types <skill-dir>/scripts/brand.ts learn --scope brand --kind rule --brand <slug> --id <id> --surface <surface> --instruction <rule> --feedback <summary>
```

Re-run `validate` and `context` for the affected surface after promotion. Never promote project patterns or exploratory preferences automatically.

## Runtime update

When the user asks to update or upgrade Brand Runtime, read `references/runtime-update.json` and follow its host-specific sequence. Runtime and Brand Pack versions are independent. Never modify packs, brand rules, project knowledge, evidence, or saved brand paths during a runtime update. State the required reload or new-session boundary after verification.

## CLI

```bash
node --experimental-strip-types <skill-dir>/scripts/brand.ts config show
node --experimental-strip-types <skill-dir>/scripts/brand.ts config set --brand-root <absolute-brand-folder>
node --experimental-strip-types <skill-dir>/scripts/brand.ts status --brand <slug>
node --experimental-strip-types <skill-dir>/scripts/brand.ts validate --brand <slug>
node --experimental-strip-types <skill-dir>/scripts/brand.ts context --brand <slug> --surface <site|product|presentation|document> --project-root <project>
node --experimental-strip-types <skill-dir>/scripts/brand.ts learn --scope project --kind <rule|learning|pattern> ...
node --experimental-strip-types <skill-dir>/scripts/brand.ts learn --scope brand --kind rule ...
```

## Reference routing

- Read `references/brand-pack-contract.json` when reviewing pack structure, ownership, or immutability.
- Read `references/brand-root-config.json` for configuration, discovery, or onboarding problems.
- Read `references/client-rules-contract.json` before promoting, updating, deprecating, or reviewing lasting brand rules.
- Read `references/design-foundation.md` for every branded creation or visual review.
- Read `references/design-direction-template.md` when creating or updating a project design direction.
- Read `references/project-learning.md` before recording or reusing project rules, learnings, patterns, or cross-project references.
- Read `references/stack-selection.md` only when selecting or recommending implementation libraries or stack.
- Read `references/surface-guidelines.md` for the selected output surface.
- Read `references/runtime-update.json` only for Brand Runtime installation or update work.
