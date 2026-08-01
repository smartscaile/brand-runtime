# Stack selection

Use this reference only when the deliverable needs a stack decision or the user requests implementation-library recommendations. Treat the catalog as curated options, never as universal defaults.

## Selection sequence

1. Inspect and preserve a suitable existing stack.
2. Identify the surface, delivery model, hosting, export, and integration constraints.
3. Separate functional UI needs from creative effects.
4. Define the required state, interaction, motion, scroll, SVG, or 3D behavior.
5. Prefer platform primitives when they satisfy the behavior cleanly.
6. Present at most a small relevant shortlist and let the user inspect creative examples.
7. Verify current official documentation, dependencies, license, accessibility, performance, and framework compatibility before adoption.
8. Record the decision and fallbacks in `docs/design/design-direction.md`.

Do not select React solely to improve visual quality. React helps with state, composition, and ecosystem integration; refinement comes from direction, hierarchy, typography, content, assets, layout relationships, and visual QA.

## Curated capability map

### Platform CSS and Web Animations API

- Consider for transitions, hover and focus feedback, simple entrances, and isolated keyframes.
- Prefer when the behavior is local, state is simple, and another runtime dependency adds no meaningful control.
- Preserve reduced-motion behavior and avoid JavaScript ownership of effects that CSS can express reliably.

### React Bits

- Official reference: <https://reactbits.dev/>
- Consider when the user wants to explore expressive React components, animated text, interactive backgrounds, cursors, or effect-driven compositions.
- Use as a creative reference or source-code starting point after the user selects an example.
- Never treat it as a complete functional design system or as automatic brand direction.
- Inspect the exact component because dependencies vary. Remap all colors, typography, spacing, motion, and component anatomy to the selected Brand Pack and project direction.

### Uiverse

- Official reference: <https://uiverse.io/>
- Consider when the user wants examples of small controls, inputs, buttons, loaders, toggles, or CSS microinteractions in HTML/CSS, Tailwind, React, or Figma.
- Treat every community contribution as untrusted reference code until reviewed.
- Audit semantics, keyboard behavior, focus, contrast, responsive behavior, browser support, performance, and license before use.

### Motion

- Official reference: <https://motion.dev/docs>
- Consider for React, JavaScript, or Vue interface motion, layout transitions, presence, gestures, scroll-linked effects, and state continuity.
- Prefer when animation belongs closely to component or layout state.
- Avoid adding another animation engine to the same ownership boundary without a documented reason.

### Anime.js

- Official reference: <https://animejs.com/documentation/>
- Consider for framework-agnostic timelines, DOM, SVG, text, draggable behavior, and modular animation control.
- Prefer granular imports when the build supports them and only a subset of features is required.
- Compare against CSS or Motion before adoption when the task is ordinary interface state animation.

### GSAP

- Official reference: <https://gsap.com/docs/v3/>
- Consider for complex choreography, long timelines, precise sequencing, narrative scroll, text, SVG, and interaction systems that require explicit orchestration.
- Select and register only the plugins the implementation needs:
  - `ScrollTrigger` for scroll-linked timelines and pinning;
  - `SplitText` for line, word, and character choreography;
  - `Flip` for transitions between layout states;
  - `MorphSVG` and `DrawSVG` for vector transformation and drawing;
  - `MotionPath` for movement along a path;
  - `ScrollSmoother` only when custom scrolling is justified and does not compromise accessibility or platform behavior.
- Assign one owner to each timeline or element group. Do not let GSAP and another engine compete for the same transforms, opacity, scroll progress, or lifecycle.

### Three.js

- Official reference: <https://threejs.org/docs/>
- Consider only when 3D or WebGL is a meaningful part of the content, product explanation, or creative thesis.
- Require an explicit performance budget, loading strategy, input model, responsive plan, and non-WebGL or reduced-motion fallback.
- Never add 3D merely as a generic signal of premium quality.

## Recommendation behavior

First distinguish the request:

- **Functional component foundation:** prioritize semantics, accessibility, state behavior, and project compatibility; do not recommend React Bits as the whole foundation.
- **Creative component reference:** show relevant React Bits or Uiverse examples and let the user choose a direction before adapting code.
- **Interface motion:** compare CSS, Motion, and Anime.js from the actual behavior.
- **Narrative or complex motion:** consider GSAP and name the required plugins.
- **3D experience:** consider Three.js only after confirming why 3D improves the experience.

Recommend options; do not install, copy, or commit a dependency until the implementation direction is accepted. After selection, inspect the exact upstream component or API instead of relying on memory or this summary.

## Integration quality gate

- Map all visible values to Brand Pack or project tokens.
- Preserve semantic HTML, focus order, keyboard behavior, readable contrast, and reduced motion.
- Remove demo-only decoration, sample copy, unused dependencies, and conflicting global styles.
- Measure bundle, loading, runtime work, and responsive behavior in proportion to the effect.
- Verify that the effect clarifies hierarchy, continuity, progress, causality, or meaning.
- Record the library, version or reviewed documentation date, selected modules or plugins, owner boundaries, and fallback in the design direction.
