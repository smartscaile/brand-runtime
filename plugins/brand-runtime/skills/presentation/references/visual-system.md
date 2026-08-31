# Presentation visual system

## Narrative architecture

Assign every slide one primary job:

- establish context;
- state a tension;
- prove a claim;
- locate a failure;
- compare alternatives;
- sequence action;
- explain a mechanism;
- request a decision;
- create a transition.

If a slide performs several jobs, split it or make one job dominant and subordinate the rest.

## Layout reasoning workflow

Complete this reasoning before naming a composition family or writing full HTML. The result is a project-local worksheet, not a global template catalog or a second source of identity.

### Content map

For every slide, state its claim, evidence, relationship, density, and constraints:

- **Claim:** the one sentence the audience should retain.
- **Evidence:** the facts, source copy, image, data, or mechanism that earns the claim.
- **Relationship:** the comparison, sequence, hierarchy, causality, tension, or decision the composition must reveal.
- **Density:** `sparse`, `balanced`, or `dense`, based on the slide's job and presentation distance.
- **Constraints:** approved copy, Brand Pack rules, local direction, canvas, accessibility, and source fidelity.

If the content exceeds the chosen density, edit, group, sequence, or split it. Do not solve overload by shrinking type, multiplying containers, or hiding evidence.

### Composition profile

Describe the first batch with four project-local fields:

- **Density:** `sparse`, `balanced`, or `dense`.
- **Distribution:** `concentrated` around one field or `distributed` across several related fields.
- **Symmetry:** `stable`, `offset`, or `asymmetric`.
- **Continuity:** `repeat`, `contrast`, or `break` relative to neighboring slides.

Every field needs a reason grounded in content, the approved visual thesis, or the intended narrative turn. Do not use these fields as a score, fixed preset, aesthetic identity, or automatic approval.

### Structural candidates

When a material layout choice remains unresolved, outline at least two structurally distinct candidates in low fidelity. Compare their dominant entry point, reading path, evidence treatment, negative space, and relationship to neighboring slides. Choose the candidate that reveals the governing relationship with the least distortion.

Candidates must differ in information structure, not only color, alignment, decoration, or image crop. Do not choose by randomization, preset rotation, or a universal family ranking. Do not implement several full HTML variants when a diagram, wireframe, or written anatomy can resolve the decision first.

### Batch rhythm

Review slides 1–3 as a thumbnail sequence before implementation and after every rendered pass. Inspect the position and size of dominant masses, density changes, focal-point movement, family anatomy, and use of negative space without trying to read body copy.

Repeat geometry when it creates continuity or recognition. Introduce contrast or a break when the narrative turns. Do not alternate layouts mechanically, and do not vary a slide merely to satisfy a diversity count.

## Page geometry

Define and reuse:

- canvas ratio and dimensions;
- safe page margin;
- header baseline;
- chapter-marker anchor;
- title block width;
- content field;
- footer and source baseline;
- column gap;
- internal stack gap.

Use a small spacing scale and map relationships before placing components. Do not compensate for a weak layout with many local pixel exceptions.

## Hierarchy

Create distance through scale, placement, density, and contrast before adding containers. A strong slide usually needs:

1. one dominant entry point;
2. one supporting explanation;
3. one evidence or action field;
4. quiet metadata.

Avoid equal-weight blocks, repeated card anatomy, excessive labels, and divider grids that make every item compete equally.

## Repeated interface

Keep page-level interface fixed unless the surface meaning changes:

- deck or section label;
- chapter label and marker;
- source;
- page number;
- navigation controls outside the printed canvas.

Anchor the chapter marker to one fixed top and right inset. Change only its active label and active dot. Do not reposition it slide by slide to avoid content; reserve its column in the layout instead.

## Visual forms

Choose the smallest form that reveals the relationship:

- exact mappings or comparisons: table;
- sequence or state: timeline, stepped path, or ordered fields;
- hierarchy or narrowing: tree, nested bands, or horizontal stage map;
- quantitative pattern: chart with visible scale and unit;
- mechanism: authored diagram;
- emotional or conceptual transition: image-led composition;
- decision: explicit options, owner, dependency, and next move.

Do not use a funnel merely because data has stages. If a funnel shape distorts the story, use aligned horizontal stages or another authored SVG component.

## Imagery

- Give imagery a narrative function: context, metaphor, evidence, product proof, or transition.
- Direct the crop around the text field and page geometry.
- Avoid generic AI atmosphere, floating abstract objects, decorative technology motifs, and images that merely repeat the headline.
- When generating an image, specify subject, object construction, physical logic, composition, camera, crop, negative space, lighting, materials, palette roles, texture, realism, and exclusions.
- Keep brand-specific image rules in the Brand Pack or project direction, never here.

## Charts and diagrams

- Keep units, baselines, labels, and direction legible at presentation distance.
- Use emphasis only for the number or transition that drives the conclusion.
- Use SVG for crisp, controllable geometry; avoid SVG filters in printable work.
- Align annotations to data geometry rather than floating them arbitrarily.
- Preserve source definitions and expose derived calculations.
