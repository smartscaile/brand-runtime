import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const runtime = resolve(import.meta.dirname, "../plugins/brand-runtime/skills/presentation/scripts/presentation-runtime.mjs");

function scaffold(output, title = "Viewer Test") {
  const result = spawnSync(process.execPath, [runtime, "scaffold", "--output", output, "--title", title], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
}


test("provides synchronized viewer navigation and progress", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-viewer-progress-"));
  try {
    scaffold(root, "Progress Test");
    const html = await readFile(resolve(root, "presentation.html"), "utf8");

    assert.match(html, /--viewer-bg:/);
    assert.match(html, /id="presentation-progress"[^>]*role="progressbar"/);
    assert.match(html, /id="presentation-active-title"/);
    assert.match(html, /aria-live="polite"/);
    assert.match(html, /presentationProgress\.style\.setProperty\(/);
    assert.match(html, /activeSlide\.dataset\.title/);
    assert.match(html, /window\.location\.hash = `slide-\$\{currentSlide\}`/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});


test("preserves keyboard and hash navigation", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-viewer-keyboard-"));
  try {
    scaffold(root, "Keyboard Test");
    const html = await readFile(resolve(root, "presentation.html"), "utf8");

    assert.match(html, /\["ArrowRight", "PageDown", " "\]/);
    assert.match(html, /\["ArrowLeft", "PageUp"\]/);
    assert.match(html, /event\.key === "Home"/);
    assert.match(html, /event\.key === "End"/);
    assert.match(html, /window\.addEventListener\("hashchange", \(\) => \{/);
    assert.match(html, /Number\(window\.location\.hash\.replace\("#slide-", ""\)\)/);
    assert.match(html, /function presentationIndexFromHash\(\)/);
    assert.match(html, /Number\.isInteger\(requestedPresentationSlide\)[\s\S]*requestedPresentationSlide <= presentationSlides\.length/);
    assert.match(html, /const normalizedIndex = Number\.isInteger\(index\) \? index : 0/);
    assert.match(html, /showPresentationSlide\(presentationIndexFromHash\(\)\)/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});


test("keeps responsive chrome outside print", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-viewer-responsive-"));
  try {
    scaffold(root, "Responsive Test");
    const html = await readFile(resolve(root, "presentation.html"), "utf8");

    assert.match(html, /class="presentation-viewer"/);
    assert.match(html, /min-width: 44px;[\s\S]*min-height: 44px;/);
    assert.match(html, /<main class="presentation-shell" id="presentation-shell">[\s\S]*id="presentation-stage"[\s\S]*<nav class="presentation-dock"/);
    assert.match(html, /\.presentation-shell \{[\s\S]*flex-direction: column;[\s\S]*gap: 12px;/);
    assert.match(html, /\.presentation-dock \{[^}]*width: min\(520px, 100%\);/);
    assert.doesNotMatch(html, /\.presentation-dock \{[^}]*position: absolute/);
    assert.match(html, /@media \(max-width: 760px\)[\s\S]*\.presentation-dock/);
    assert.match(html, /@media \(max-width: 760px\)[\s\S]*\.presentation-dock \{[^}]*width: min\(340px, 100%\);/);
    assert.doesNotMatch(html, /@media \(max-width: 440px\)[\s\S]*?\.presentation-dock__status \{[^}]*flex:\s*0\s+1\s+auto/);
    assert.match(html, /\.presentation-stage \{[^}]*background: transparent;[^}]*overflow: hidden;/);
    assert.doesNotMatch(html, /0 0 0 1px/);
    assert.match(html, /@media \(prefers-reduced-motion: reduce\)/);
    assert.match(html, /@media print \{[\s\S]*\.presentation-viewer \{ display: none !important; \}/);
    assert.match(html, /@media print \{[\s\S]*\.presentation-dock \{ display: none !important; \}/);
    assert.match(html, /const presentationShell = document\.querySelector\("#presentation-shell"\)/);
    assert.match(html, /const presentationDock = document\.querySelector\("\.presentation-dock"\)/);
    assert.match(html, /getComputedStyle\(presentationShell\)/);
    assert.match(html, /presentationDock\.offsetHeight/);
    assert.match(html, /presentationDownload\.addEventListener\("click", \(\) => window\.print\(\)\)/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
