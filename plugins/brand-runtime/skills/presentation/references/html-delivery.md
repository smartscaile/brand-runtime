# Fixed-page HTML delivery

## Starter

Create an identity-neutral authoring file with:

```bash
node <skill-dir>/scripts/presentation-runtime.mjs scaffold \
  --output <project-directory> \
  --title "Presentation title"
```

The command copies `assets/html-starter/presentation.html`. Replace its project-token block, placeholder content, and sample slides before presenting it as finished work. The starter provides mechanics, not brand identity or a visual template.

## Authoring contract

- Keep each printable slide as `.slide` with a fixed 16:9 canvas by default.
- Keep the authoring document self-contained before final export: inline CSS, JavaScript, fonts, SVG, and raster assets.
- Set `data-title`, `data-section`, and source metadata where relevant.
- Use `hidden` only for screen navigation. Print CSS must expose all slides.
- Reserve a fixed column for `.chapter-marker` when used.
- Set `window.__presentationReady` only after fonts, images, charts, and layout are stable.
- Keep the PDF payload placeholder intact in the authoring file.

## Screen controls

Place controls outside the slide canvas. Provide:

- Previous;
- page count;
- Next;
- Download PDF.

Support Left Arrow, Right Arrow, Home, and End. Hide controls and preview chrome during print.

## Direct download

The shareable HTML must download exact finalized PDF bytes through a Blob URL and a deliberate filename. The recipient must not need browser print or a PDF regeneration library.

The export script:

1. opens the authoring HTML in headless Chrome;
2. waits for `document.fonts.ready` and `window.__presentationReady`;
3. checks layout and prohibited effects;
4. prints exact 16:9 pages through the Chrome DevTools Protocol;
5. validates the PDF with Poppler;
6. renders PDF pages for inspection;
7. embeds the validated PDF into a separate shareable HTML file;
8. verifies the embedded payload hash.

## Renderer-safe implementation

Inside `.slide`, avoid:

- `filter` and SVG filter references;
- `backdrop-filter`;
- `mask-image` and SVG masks for soft effects;
- `mix-blend-mode`;
- large blurred `box-shadow` values;
- overlapping translucent gradients;
- remote or late-loading assets;
- viewport-relative canvas dimensions;
- print-time JavaScript mutations.

Use flat fills, borders, embedded fonts, simple opacity, and authored SVG paths. If an essential effect is rasterized, verify its resolution at export size.

## Export

```bash
node <skill-dir>/scripts/presentation-runtime.mjs export \
  --input <authoring.html> \
  --pdf <final.pdf> \
  --html <shareable.html> \
  --qa-dir <qa-directory>
```

Never overwrite the authoring HTML with the embedded payload. The authoring file must remain small and editable.
