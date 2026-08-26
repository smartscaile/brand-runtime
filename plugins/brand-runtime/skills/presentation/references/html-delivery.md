# Fixed-page HTML delivery

## Starter

Create an identity-neutral authoring file with:

```bash
node <skill-dir>/scripts/presentation-runtime.mjs scaffold \
  --output <project-directory> \
  --title "Presentation title"
```

The command creates a protected set from `assets/html-starter/`:

- `presentation.html`;
- `presentation.spec.json`;
- `presentation.approvals.json`.

If any member already exists, scaffold refuses replacement unless `--force` is explicit. Replace the HTML project-token block, placeholder content, and sample slides before presenting it as finished work. The starter provides mechanics and contract examples, not brand identity or a visual template.

The CLI rejects unknown or duplicate options. `--force` never authorizes following a symlink at a scaffold or delivery output path. Runtime-owned files are written to unique temporary siblings and atomically promoted, so a symlink introduced after preflight is replaced rather than followed; a symlink already present at command start is rejected explicitly.

## Authoring contract

- Keep each printable slide as `.slide` with a fixed 16:9 canvas by default.
- Keep the authoring document self-contained before final export: inline CSS, JavaScript, fonts, SVG, and raster assets.
- Keep ordered `data-slide-id`, `data-slide-job`, and `data-slide-family` attributes aligned with `presentation.spec.json`.
- Treat family names as project-local semantics, not a universal catalog or CSS template.
- Set `data-title`, `data-section`, and source metadata where relevant.
- Use `hidden` only for screen navigation. Print CSS must expose all slides.
- Reserve a fixed column for `.chapter-marker` when used.
- Set `window.__presentationReady` only after fonts, images, charts, and layout are stable.
- Keep the PDF payload placeholder intact in the authoring file.
- Keep `briefStatus: draft` until the audience, decision, content constraints, and local direction are resolved; change it to `ready` before export.

## Contract preflight

Run before HTML export or optional PDF generation:

```bash
node <skill-dir>/scripts/presentation-runtime.mjs quality \
  --input <authoring.html>
```

The command discovers sibling contracts by default. Use `--spec <path>` or `--approvals <path>` only when the sources intentionally live elsewhere. Blocking findings are emitted as deterministic JSON with affected slides and observed evidence; no aggregate taste score is produced.

Read `quality-policy.md` before changing thresholds, interpreting findings, recording approvals, or freezing artifacts.

## Screen controls

Place controls outside the slide canvas. Provide:

- Previous;
- page count;
- Next;
- Save PDF.

Support Left Arrow, Right Arrow, Home, and End. Hide controls and preview chrome during print.

## HTML-first save and opt-in direct download

By default, the shareable HTML contains no PDF payload. Save PDF opens the browser's native print/save dialog and relies on the document's exact `@page` and print CSS. When `--pdf <final.pdf>` is explicit, the Runtime validates and embeds those exact bytes, relabels the control Download PDF, and uses a Blob URL with a deliberate filename. Neither mode uses a recipient-side PDF library.

The export script:

1. starts headless Chrome on `about:blank` behind a Runtime-owned sink proxy, enables CDP interception/evidence for HTTP(S), WebSocket, and FTP, then navigates to the authoring HTML;
2. waits for `document.fonts.ready` and `window.__presentationReady` under a bounded deadline;
3. validates the sibling contract and ordered slide metadata;
4. emits project-threshold findings for family sequence and eyebrow saturation;
5. stops before PDF creation when the system gate blocks;
6. checks layout and prohibited effects;
7. without `--pdf`, inlines local assets, removes the `__PDF_PAYLOAD__` token while retaining the empty payload script element, promotes the standalone HTML with its QA report, and reports `technicalQa: not-run` with `deliveryState: awaiting-technical-qa` for contract-v1 decks;
8. with `--pdf`, prints exact 16:9 pages through the Chrome DevTools Protocol and normalizes variable PDF creation/modification metadata;
9. validates the normalized PDF with Poppler;
10. clears only managed captures from a prior run and renders current browser/PDF pages for inspection;
11. embeds the validated PDF into a separate shareable HTML file and verifies the payload hash;
12. derives approvals, freeze, and `deliveryState` without a generic pass flag.

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
  --html <shareable.html> \
  --qa-dir <qa-directory>
```

Add `--pdf <final.pdf>` only when Runtime-generated, Poppler-validated and embedded PDF bytes are explicitly required.

Never overwrite the authoring HTML with the embedded payload. The authoring file must remain small and editable.

Readiness defaults to 15 seconds. Use `--ready-timeout-ms <1..120000>` only when a project or CI environment has an explicit reason to override it. The deadline applies to target discovery, `/json` fetch, WebSocket opening, CDP initialization, navigation, and presentation readiness. A timeout produces `browser-inspection-failed`, closes CDP and the local sink, terminates Chrome's isolated process group under a bounded SIGTERM/SIGKILL sequence, removes its temporary profile, writes a structured QA report when `--qa-dir` is present, and exits non-zero. The same awaited cleanup runs after successful inspection and startup failure. If cleanup itself is incomplete, the Runtime emits `browser-cleanup-failed` and serializes aggregate causes under `evidence` when the report destination remains usable.

Delivery artifacts are transactional at the packaging boundary. Existing destinations must be regular files; directories, symlinks, and other entry types are rejected before rendering. HTML-only stages the standalone HTML; explicit PDF mode stages HTML and PDF. In both modes, the final `qa-report.json` is built in staging and committed in the same rollback-capable promotion as the delivery artifacts, while each entry preserves its own overwrite/no-clobber policy. A report-publication, print/metadata-normalization, local-asset, payload, or promotion failure before commit restores any previous final delivery, emits the current failure report when its destination is valid, preserves rendered QA evidence, and removes only staging/backup files owned by the failed attempt. Once every staged member is promoted, the commit is complete; backup deletion is post-commit cleanup and cannot relabel a valid new delivery as a reversible packaging failure.

Keep every local image, font, and other deliverable asset inside the authoring HTML directory or one of its descendants. Export rejects parent traversal and symlinks whose real target is outside that boundary. It also rejects executable `javascript:` and `vbscript:` references instead of preserving them in the shareable HTML.

Pending approvals allow review artifacts to be exported but keep the report in an `awaiting-*` state. Only matching HTML, PDF, and spec hashes under a human-authorized freeze produce `deliveryState: frozen`. A technically valid deck without `presentation.spec.json` remains exportable as `legacy-unverified` and is never silently migrated; a technical failure remains `blocked` even in legacy mode.
