# Presentation QA

## Source and content

- Confirm slide order, titles, approved copy, numbers, units, definitions, and sources.
- Reconcile derived figures and label estimates, proposals, and targets.
- Confirm that translations preserve factual meaning and approved terminology.

## Browser render

- Wait for fonts, images, charts, and layout readiness.
- Inspect every slide at full canvas.
- Inspect dense tables, charts, diagrams, footers, markers, and overlapping media at detail scale.
- Check child bounds against the slide canvas and internal containers.
- Check recurring anchors numerically, not only by eye.
- Confirm that keyboard navigation, page count, and direct download work.

## PDF structure

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

When complex SVG, opacity, or layering remains, also open representative PDF pages through a second renderer such as Chrome, Preview, or Acrobat. Treat disagreement as a defect and simplify the printable composition.

## Artifact integrity

- Hash the validated PDF.
- Extract or decode the PDF embedded in the shareable HTML.
- Confirm both hashes match.
- Test the Download PDF control and verify filename, byte count, and hash.
- Package only final deliverables and intentional source files.

## Block conditions

Do not deliver when any page is unreviewed, any required font is missing, any Type 3 font appears unexpectedly, any PDF render differs materially from the approved browser render, or the downloadable bytes differ from the validated PDF.
