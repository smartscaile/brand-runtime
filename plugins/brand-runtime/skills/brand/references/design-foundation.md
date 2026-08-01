# Universal design foundation

This foundation defines a quality floor for interface and artifact direction. It is deliberately identity-neutral. A Brand Pack supplies official identity in `brand-pack`; an explicitly provisional project direction owns non-official visual choices in `brand-pending`.

## Boundaries

- In `brand-pack`, never introduce a color, font, logo, icon family, radius style, shadow style, voice, or visual motif that the selected Brand Pack does not authorize.
- In `brand-pending`, keep identity-like choices project-local, provisional, and replaceable. Never add an official logo or claim that these choices represent the client's brand.
- Never treat this foundation as a fallback Brand Pack.
- Never call a particular aesthetic universally premium, modern, elegant, technical, editorial, or beautiful.
- Prefer relationships and semantic roles over isolated values.
- Let content, user intent, medium, and brand determine composition.

## Information and hierarchy

- Give each composition one dominant idea, one primary evidence or content block, and one clear next action when an action exists.
- Make hierarchy understandable through size, weight, position, spacing, and sequence. Do not rely on color alone.
- Keep supporting copy subordinate to the main message and control line length for comfortable reading.
- Preserve meaningful content and order unless the user explicitly requests editorial changes.
- Keep related items visibly closer to one another than to unrelated groups.

## Layout relationships

Before implementation, map four spacing roles to declared Brand Pack tokens or provisional project-local roles:

1. page or canvas margin;
2. section gap;
3. component inset;
4. internal stack gap.

Reuse a role consistently. Change it deliberately by breakpoint or composition, never as an isolated patch. Use grid columns, alignment, proportion, and negative space to establish rhythm rather than filling every region with a component.

## Content-safe components

- Size text-bearing containers from content by default.
- Use fixed dimensions only when the output format requires them and rendered content remains inside every inset.
- Avoid hidden overflow, masks, clipping, and line clamping for authored content unless truncation is requested and communicated.
- Use predictable border-box sizing, container padding, layout gaps, and controlled child margins.
- Treat cards, dividers, badges, pills, and callouts as semantic components, not automatic decoration.
- Do not repeat one card anatomy merely to create visual consistency.

## Typography

- In `brand-pack`, use only declared families, roles, styles, and weights. In `brand-pending`, select accessible, licensed project-local typography and mark it provisional.
- Establish clear display, heading, body, label, data, and annotation roles only when the content needs them.
- Preserve readable line height and measure at every breakpoint.
- Avoid arbitrary scale changes used only to force content into a fixed box.
- Wait for final fonts before judging wrapping, density, or containment.

## Color and contrast

- Use semantic color roles before primitive values. In `brand-pending`, keep their values provisional and project-local.
- Maintain readable contrast for text, controls, focus, and status communication.
- Reserve accent colors for meaningful emphasis or action.
- Do not use gradients, glows, noise, translucency, or dark surfaces as automatic signals of quality.
- Keep status colors tied to status meaning.

## Imagery and iconography

- Define what imagery must communicate before choosing or generating it.
- Keep subject, crop, light, perspective, grading, and density coherent with the project thesis.
- Use declared Brand Pack assets in `brand-pack`; use only authorized project assets in `brand-pending`. Preserve proportions and intended use.
- Map official icons to real functions before adding decorative symbols.
- Prefer typography, spacing, data, or imagery when an icon adds no meaning.

## Interaction and motion

- Make primary actions identifiable and keep state changes stable across pointer, keyboard, touch, loading, success, and error states.
- Use motion to explain continuity, hierarchy, progress, or causality.
- Avoid motion that competes with reading or exists only to imply polish.
- Respect reduced-motion preferences while preserving state feedback.

## Responsive behavior

- Recompose by priority instead of shrinking a desktop arrangement mechanically.
- Preserve readable measure, touch targets, content order, and mapped insets.
- Verify long content, localization, keyboard navigation, zoom, and reduced motion when relevant.
- On mobile, remove nonessential chrome before reducing content or interaction clarity.

## Visual QA

Render the required breakpoints and exports after final assets and fonts load. Inspect:

- hierarchy and focal point;
- alignment and proximity;
- density and negative space;
- text and child bounds;
- scroll dimensions and edge insets;
- contrast and interaction states;
- asset integrity;
- repeated visual patterns without semantic purpose;
- consistency with the project design direction and the selected direction mode.

Structural correctness is necessary but not sufficient. Refine until the composition communicates the intended perception without generic decorative shortcuts.
