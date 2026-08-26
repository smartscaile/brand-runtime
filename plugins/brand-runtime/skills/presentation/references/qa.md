# Presentation QA

## Gate boundaries

- **Technical QA** verifies rendering, structure, fonts, pages, and artifact bytes.
- **System diagnostics** verify the v1 contract and project-declared thresholds with explainable findings.
- **Human review** approves content and visual direction and authorizes freeze.

Do not collapse these into one pass flag. Run `quality --input <authoring.html>` before HTML export or optional PDF generation and read `quality-policy.md` for the normative lifecycle.

## Source and content

- Confirm slide order, titles, approved copy, numbers, units, definitions, and sources.
- Reconcile derived figures and label estimates, proposals, and targets.
- Confirm that translations preserve factual meaning and approved terminology.

## Browser render

- Confirm `presentation.spec.json` is valid, `briefStatus` is `ready`, and ordered slide metadata matches rendered `id`, `job`, and `family`.
- Resolve blocking findings for slide-count mismatch, metadata mismatch, family-run limits, or eyebrow ratio before export.
- Confirm sandboxed inspection reports no `remote-resource-reference`; network protocols are blocked before the deck is loaded.
- Wait for fonts, images, charts, and layout readiness.
- Inspect every slide at full canvas.
- Inspect dense tables, charts, diagrams, footers, markers, and overlapping media at detail scale.
- Check child bounds against the slide canvas and internal containers.
- Check recurring anchors numerically, not only by eye.
- Confirm keyboard navigation and page count. In HTML-first mode, test Save PDF opening the native print dialog; in explicit PDF mode, test direct download.

## PDF structure

Apply the PDF sections only after a person or command explicitly supplies a PDF. HTML-first review does not run Poppler and remains `technicalQa: not-run`.

Use `pdfinfo` to verify:

- expected page count;
- expected 16:9 page dimensions or explicitly requested ratio;
- no encryption or unexpected rotation.

Use `pdffonts` to verify:

- fonts are embedded;
- expected font families are present;
- no unexpected Type 3 font exists.

## PDF render

Render every page with `pdftoppm`. Review the rendered images for:

- shifted or missing text;
- changed line breaks;
- clipping or overflow;
- lost backgrounds;
- transparency blocks;
- shadow bounding boxes;
- SVG filter halos;
- mask or blend artifacts;
- low-resolution images;
- inconsistent chapter markers;
- incorrect footer or page number placement.

The Runtime removes only managed `browser-N.png` and `pdf-N.png` files before a new render. Confirm the reviewed set belongs to the current run; unrelated human evidence in the QA directory is preserved.

When complex SVG, opacity, or layering remains, also open representative PDF pages through a second renderer such as Chrome, Preview, or Acrobat. Treat disagreement as a defect and simplify the printable composition.

## Artifact integrity

- In HTML-first mode, verify that no PDF payload or PDF output was created and that Save PDF invokes native print.
- In explicit PDF mode, hash the validated PDF, decode the embedded payload, confirm both hashes match, and test Download PDF filename, byte count, and hash.
- Package only final deliverables and intentional source files.
- Confirm successful export committed `qa-report.json` with the HTML-only artifact or PDF/HTML pair and that its JSON equals stdout.
- Confirm a packaging failure left `qa-report.json`, no incomplete staging files, and either no final HTML/PDF or the unchanged previous valid delivery.
- Confirm directory, symlink, and other non-regular destinations fail before browser rendering and preserve any previous delivery.
- Confirm target discovery, `/json`, WebSocket handshake, CDP initialization, navigation, readiness, and stubborn-launcher probes terminate within budget with no Chrome process, local sink, socket, or `presentation-runtime-chrome-*` profile left behind.
- Inject a profile-removal failure and confirm `browser-cleanup-failed` carries serialized aggregate causes, no delivery artifact is published, and the browser process is terminated.

## Approval and freeze

- Confirm content and visual decisions were authored by a person with actor, timestamp, scope, and evidence.
- Treat `pending`, `rejected`, `invalidated`, and `invalid` as distinct states; none means approved.
- Confirm a frozen record carries current `htmlSha256`, `pdfSha256`, and `specSha256`.
- Run `qa` against the exact frozen HTML and PDF. A hash mismatch must produce `freeze: invalidated`, `deliveryState: blocked`, and exit 1 after writing the report.
- Accept `deliveryState: frozen` as final only after inspecting browser and PDF evidence. Technical automation does not perform the visual approval.

Review artifacts may legitimately remain `awaiting-content-approval`, `awaiting-visual-approval`, or `awaiting-freeze`. These states are not failures, but they are not final delivery.

Technically valid decks without a v1 contract remain `legacy-unverified`; preserve their export path while requiring deliberate migration before claiming governed completion. A technical failure always produces `deliveryState: blocked`, including for a legacy deck.

## Block conditions

Do not deliver an HTML review artifact when a browser page is unreviewed, a required font is missing, or a blocking finding remains. Do not claim a final frozen PDF delivery when a Type 3 font appears unexpectedly, a PDF render differs materially from the approved browser render, downloadable bytes differ from the validated PDF, an approval is absent, or freeze hashes do not match current artifacts.
