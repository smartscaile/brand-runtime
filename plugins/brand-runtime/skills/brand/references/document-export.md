# Fixed-page HTML and PDF delivery

Use this reference only when a document needs physical-page preview, fixed-page export, or direct PDF download. Keep continuous-flow documents in continuous flow unless the user or delivery channel requires pagination.

These rules are identity-neutral. The selected Brand Pack or provisional project direction still owns typography, color, logo, iconography, radius, voice, and visual emphasis.

## Preview contract

- Use HTML as the viewing interface and the PDF as the finalized downloadable artifact.
- Default to a compact screen-only toolbar above the document. Keep document context on the left and the primary download action in the upper-right.
- Label the action directly, such as `Baixar em PDF` or `Download PDF`, using the language of the deliverable.
- Show fixed pages as separate sheets on a neutral workspace when physical preview matters.
- Derive sheet width, height, padding, and `@page` from the same geometry. Do not maintain unrelated screen and print layouts.
- Keep toolbar, workspace gaps, and optional sheet elevation screen-only. Exclude them from print and PDF output.
- On small screens, preserve content order and readable type. Use fluid page width and natural height unless exact fixed-page simulation is required.

## Direct download contract

- A click on the download action must create a file download. Do not use `window.open`, `target="_blank"`, `location.href`, an iframe, or an ordinary PDF link when direct download was requested.
- Disable or withhold the action until the final validated PDF exists.
- For a self-contained HTML deliverable, generate the final PDF first, embed its bytes as a data URL or Blob, create an anchor with `download="<filename>.pdf"`, and trigger that anchor from the action.
- For a hosted deliverable, prefer a same-origin file or download endpoint that returns `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="<filename>.pdf"`.
- Do not rely on the `download` attribute for a cross-origin PDF. Browsers may ignore it without a same-origin response or an attachment header.
- Preserve the approved filename and `.pdf` extension. Never silently substitute a browser-generated name.
- Show a real error state when generation or download preparation fails. Do not relabel navigation or the print dialog as a completed download.
- Test the visible action itself. Verify that it creates a local file and that the downloaded byte hash matches the finalized PDF.

### Standalone implementation pattern

For a self-contained HTML file, embed the already validated PDF as base64 and convert those exact bytes to a Blob only when the user clicks. Use this behavior as the default implementation pattern; adapt selectors and accessible states without changing the delivery contract.

```js
const button = document.querySelector("#download-pdf");
const payload = document.querySelector("#pdf-payload");
const filename = "document.pdf";

button.addEventListener("click", () => {
  const binary = atob(payload.textContent.trim());
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
});
```

Keep the base64 payload in a non-executable element such as `<script id="pdf-payload" type="application/octet-stream">`. Do not export a second PDF in the browser; the embedded payload must be the final artifact that passed validation.

## Build sequence

1. Compose the HTML preview with the final content and declared assets.
2. Wait for final fonts and assets before measuring or paginating.
3. Paginate by units of meaning and validate every page boundary.
4. Export the PDF from the same page geometry used by the preview.
5. Validate the PDF before enabling the download action.
6. Embed or connect the validated PDF without rebuilding it from a different layout.
7. Reopen the final HTML, activate the visible download control, and verify filename, bytes, and behavior.

## Typography and PDF conversion

- Use only families, styles, and weights authorized by the selected Brand Pack or provisional project direction.
- Map authored weights to actual font files. Avoid intermediate weights that the renderer must synthesize.
- Variable fonts remain valid for Web use. For fixed PDF export, use static instances for the required weights when the renderer converts variable fonts to Type 3 or produces visibly inconsistent glyphs.
- Paginate only after the exact export fonts have loaded. A fallback-font pagination pass is invalid.
- Preserve readable type size, line height, contrast, and measure. Do not shrink legal, technical, or commercial copy merely to retain an arbitrary page count.

## Export quality gate

- Confirm physical page size, page count, shared geometry, edge insets, reserved footer areas, overflow, widows, orphans, and reading continuity.
- Compare the HTML preview and PDF at the same page scale. Typography, wrapping, component bounds, and authored backgrounds must remain materially equivalent.
- Reject unexpected Type 3 fonts, missing font embedding, full-page rasterization, duplicated text rendering, or decorative effects that degrade text clarity.
- Keep vectors and live text whenever possible. Remove or simplify shadows, repeated textures, filters, or compositing effects when they cause rasterized groups or mismatched export.
- Render every page to an image and inspect it. A successful export command is not visual QA.
- Confirm that the final HTML contains the same validated PDF that the download action delivers.

Use available inspection tools when applicable:

```bash
pdfinfo <document.pdf>
pdffonts <document.pdf>
pdfimages -list <document.pdf>
pdftoppm -png <document.pdf> <render-prefix>
```
