import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const runtime = resolve(import.meta.dirname, "../plugins/brand-runtime/skills/presentation/scripts/presentation-runtime.mjs");

function run(args) {
  const result = spawnSync(process.execPath, [runtime, ...args], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

test("scaffolds an identity-neutral presentation authoring file", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-scaffold-"));
  try {
    const output = run(["scaffold", "--output", root, "--title", "Runtime Test"]);
    assert.equal(output, resolve(root, "presentation.html"));
    const html = await readFile(resolve(root, "presentation.html"), "utf8");
    assert.match(html, /<title>Runtime Test<\/title>/);
    assert.match(html, /Previous/);
    assert.match(html, /Next/);
    assert.match(html, /Download PDF/);
    assert.match(html, /__PDF_PAYLOAD__/);
    assert.match(html, /Runtime_Test\.pdf/);
    assert.match(html, /window\.__presentationReady/);
    assert.doesNotMatch(html, /boont|checkgrow|smartscaile/i);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("exports and validates a standalone HTML and exact PDF payload", { timeout: 30000 }, async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-export-"));
  try {
    run(["scaffold", "--output", root, "--title", "Export Test"]);
    const input = resolve(root, "presentation.html");
    const pdf = resolve(root, "Export_Test.pdf");
    const html = resolve(root, "Export_Test.html");
    const qa = resolve(root, "qa");
    const report = JSON.parse(run([
      "export",
      "--input", input,
      "--pdf", pdf,
      "--html", html,
      "--qa-dir", qa,
    ]));
    assert.equal(report.status, "passed");
    assert.equal(report.inspection.slideCount, 2);
    assert.equal(report.pdfInspection.pages, 2);
    assert.equal(report.pdfInspection.renderedPages, 2);
    assert.equal(report.pdfInspection.hasType3, false);
    assert.equal(report.pdfSha256, report.embeddedPdfSha256);
    const shareable = await readFile(html, "utf8");
    assert.doesNotMatch(shareable, /__PDF_PAYLOAD__/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
