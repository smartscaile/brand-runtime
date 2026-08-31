import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { chmod, lstat, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import test from "node:test";

const runtime = resolve(import.meta.dirname, "../plugins/brand-runtime/skills/presentation/scripts/presentation-runtime.mjs");

function runResult(args) {
  return spawnSync(process.execPath, [runtime, ...args], { encoding: "utf8" });
}

function run(args) {
  const result = runResult(args);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

function findChromeExecutable() {
  const candidates = [
    process.env.PRESENTATION_CHROME,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (spawnSync("test", ["-x", candidate]).status === 0) return candidate;
  }
  for (const command of ["google-chrome", "chromium", "chromium-browser"]) {
    const lookup = spawnSync("which", [command], { encoding: "utf8" });
    if (lookup.status === 0 && lookup.stdout.trim()) return lookup.stdout.trim();
  }
  throw new Error("Chrome executable was not found for the cleanup test.");
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function startRequestCounter(root) {
  const serverPath = resolve(root, "request-counter.mjs");
  await writeFile(serverPath, `
    import http from "node:http";
    let requests = 0;
    let upgrades = 0;
    const server = http.createServer((request, response) => {
      if (request.url === "/count") response.end(String(requests));
      else if (request.url === "/upgrades") response.end(String(upgrades));
      else { requests += 1; response.end("ok"); }
    });
    server.on("upgrade", (request, socket) => { upgrades += 1; socket.end(); });
    server.listen(0, "127.0.0.1", () => process.stdout.write(String(server.address().port) + "\\n"));
  `);
  const child = spawn(process.execPath, [serverPath], { stdio: ["ignore", "pipe", "pipe"] });
  const port = await new Promise((resolvePort, reject) => {
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk;
      const match = output.match(/^(\d+)\n/);
      if (match) resolvePort(Number(match[1]));
    });
    child.once("error", reject);
    child.once("exit", (code) => reject(new Error(`request counter exited before startup with ${code}`)));
  });
  return {
    port,
    async count() {
      return Number(await fetch(`http://127.0.0.1:${port}/count`).then((response) => response.text()));
    },
    async upgrades() {
      return Number(await fetch(`http://127.0.0.1:${port}/upgrades`).then((response) => response.text()));
    },
    close() {
      child.kill("SIGTERM");
    },
  };
}

async function writeQualityFixture(root, { slides, maxConsecutiveFamily = 2, maxEyebrowRatio = 1, eyebrowSlides = [] }) {
  const sections = slides.map((slide, index) => `
    <section class="slide" data-slide-id="${slide.id}" data-slide-job="${slide.job}" data-slide-family="${slide.family}">
      ${eyebrowSlides.includes(slide.id) ? '<p data-presentation-role="eyebrow">Section</p>' : ""}
      <h2>${slide.id}</h2><p>Slide ${index + 1}</p>
    </section>`).join("");
  await writeFile(resolve(root, "presentation.html"), `<!doctype html><html><head><style>
    * { box-sizing: border-box; }
    .slide { width: 1280px; height: 720px; overflow: hidden; }
  </style></head><body><main class="presentation-deck">${sections}</main></body></html>`);
  await writeJson(resolve(root, "presentation.spec.json"), {
    schema: "smartscaile.presentation-spec.v1",
    title: "Quality Fixture",
    briefStatus: "ready",
    qualityPolicy: { maxConsecutiveFamily, maxEyebrowRatio },
    slides,
  });
  return resolve(root, "presentation.html");
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
    assert.match(html, /Save PDF/);
    assert.match(html, /__PDF_PAYLOAD__/);
    assert.match(html, /Runtime_Test\.pdf/);
    assert.match(html, /window\.print\(\)/);
    assert.match(html, /window\.__presentationReady/);
    assert.doesNotMatch(html, /boont|checkgrow|smartscaile/i);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects unknown and duplicate CLI options", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-cli-options-"));
  try {
    const input = await writeQualityFixture(root, {
      slides: [{ id: "opening", job: "context", family: "statement" }],
    });
    const unknown = runResult(["quality", "--input", input, "--unknown", "value"]);
    assert.equal(unknown.status, 1);
    assert.match(unknown.stderr, /unknown option --unknown/);

    const duplicate = runResult(["quality", "--input", input, "--input", input]);
    assert.equal(duplicate.status, 1);
    assert.match(duplicate.stderr, /duplicate option --input/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("does not follow a symlinked scaffold destination under force", async () => {
  const outer = await mkdtemp(resolve(tmpdir(), "presentation-runtime-scaffold-symlink-"));
  const root = resolve(outer, "deck");
  try {
    await mkdir(root);
    const outside = resolve(outer, "outside.html");
    await writeFile(outside, "outside-bytes");
    await symlink(outside, resolve(root, "presentation.html"));
    const result = runResult(["scaffold", "--output", root, "--force"]);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /symlinked output path/);
    assert.equal(await readFile(outside, "utf8"), "outside-bytes");
  } finally {
    await rm(outer, { recursive: true, force: true });
  }
});

test("does not follow an output symlink introduced during export", { timeout: 30000 }, async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-output-race-"));
  try {
    run(["scaffold", "--output", root, "--title", "Output Race"]);
    const input = resolve(root, "presentation.html");
    const specPath = resolve(root, "presentation.spec.json");
    const spec = JSON.parse(await readFile(specPath, "utf8"));
    spec.briefStatus = "ready";
    await writeJson(specPath, spec);
    const outside = resolve(root, "outside.txt");
    const pdf = resolve(root, "delivery.pdf");
    const html = resolve(root, "delivery.html");
    const qaDirectory = resolve(root, "qa");
    await writeFile(outside, "sentinel");

    const child = spawn(process.execPath, [
      runtime,
      "export",
      "--input", input,
      "--pdf", pdf,
      "--html", html,
      "--qa-dir", qaDirectory,
      "--force",
    ], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });

    const browserDirectory = resolve(qaDirectory, "browser");
    for (let attempt = 0; attempt < 1000; attempt += 1) {
      try {
        if ((await readdir(browserDirectory)).length) break;
      } catch {}
      await new Promise((resolveWait) => setTimeout(resolveWait, 5));
    }
    await rm(pdf, { force: true });
    await symlink(outside, pdf);
    const exitCode = await new Promise((resolveExit, reject) => {
      child.once("error", reject);
      child.once("exit", resolveExit);
    });

    assert.equal(exitCode, 0, stderr || stdout);
    assert.equal(await readFile(outside, "utf8"), "sentinel");
    assert.equal((await lstat(pdf)).isSymbolicLink(), false);
    assert.match((await readFile(pdf)).subarray(0, 5).toString("ascii"), /^%PDF-/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});


test("scaffolds coherent presentation contracts", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-contract-scaffold-"));
  try {
    run(["scaffold", "--output", root, "--title", "Contract Test"]);
    const html = await readFile(resolve(root, "presentation.html"), "utf8");
    const spec = JSON.parse(await readFile(resolve(root, "presentation.spec.json"), "utf8"));
    const approvals = JSON.parse(await readFile(resolve(root, "presentation.approvals.json"), "utf8"));

    assert.equal(spec.schema, "smartscaile.presentation-spec.v1");
    assert.equal(spec.briefStatus, "draft");
    assert.deepEqual(spec.slides, [
      { id: "opening", job: "context", family: "statement" },
      { id: "evidence", job: "proof", family: "evidence" },
      { id: "decision", job: "decision", family: "decision" },
    ]);
    for (const slide of spec.slides) {
      assert.match(html, new RegExp(`data-slide-id="${slide.id}"[^>]*data-slide-job="${slide.job}"[^>]*data-slide-family="${slide.family}"`));
    }
    assert.equal(approvals.schema, "smartscaile.presentation-approvals.v1");
    assert.equal(approvals.content.status, "pending");
    assert.equal(approvals.visual.status, "pending");
    assert.equal(approvals.freeze.status, "pending");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});


test("blocks contract metadata mismatches", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-contract-mismatch-"));
  try {
    run(["scaffold", "--output", root, "--title", "Mismatch Test"]);
    const input = resolve(root, "presentation.html");
    const source = await readFile(input, "utf8");
    await writeFile(input, source.replace('data-slide-family="evidence"', 'data-slide-family="comparison"'));
    await writeJson(resolve(root, "presentation.spec.json"), {
      schema: "smartscaile.presentation-spec.v1",
      title: "Mismatch Test",
      briefStatus: "ready",
      qualityPolicy: { maxConsecutiveFamily: 2, maxEyebrowRatio: 1 },
      slides: [
        { id: "opening", job: "context", family: "statement" },
        { id: "evidence", job: "proof", family: "evidence" },
        { id: "decision", job: "decision", family: "decision" },
      ],
    });

    const result = runResult(["quality", "--input", input]);
    assert.equal(result.status, 1);
    assert.notEqual(result.stdout.trim(), "", result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.reportSchema, "smartscaile.presentation-quality-report.v1");
    assert.equal("reportVersion" in report, false);
    assert.equal(report.systemDiagnostics, "failed");
    assert.equal(report.deliveryState, "blocked");
    const finding = report.findings.find(({ rule }) => rule === "contract-mismatch");
    assert.deepEqual(finding.slides, ["evidence"]);
    assert.deepEqual(finding.evidence, {
      field: "family",
      expected: "evidence",
      observed: "comparison",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});


test("reports consecutive family overuse without a beauty score", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-family-overuse-"));
  try {
    const slides = [
      { id: "opening", job: "context", family: "statement" },
      { id: "tension", job: "tension", family: "statement" },
      { id: "decision", job: "decision", family: "statement" },
    ];
    const input = await writeQualityFixture(root, { slides, maxConsecutiveFamily: 2 });

    const result = runResult(["quality", "--input", input]);
    assert.equal(result.status, 1);
    assert.notEqual(result.stdout.trim(), "", result.stderr);
    const report = JSON.parse(result.stdout);
    const finding = report.findings.find(({ rule }) => rule === "consecutive-family-overuse");
    assert.equal(finding.message, "A slide family exceeds the configured consecutive-use limit.");
    assert.deepEqual(finding.slides, ["opening", "tension", "decision"]);
    assert.deepEqual(finding.evidence, { family: "statement", count: 3, limit: 2 });
    assert.equal(report.systemDiagnostics, "failed");
    assert.equal("score" in report, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});


test("rejects quality thresholds outside the public schema", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-policy-limit-"));
  try {
    const input = await writeQualityFixture(root, {
      slides: [{ id: "opening", job: "context", family: "statement" }],
      maxConsecutiveFamily: 11,
    });
    const result = runResult(["quality", "--input", input]);

    assert.equal(result.status, 1);
    assert.notEqual(result.stdout.trim(), "", result.stderr);
    const report = JSON.parse(result.stdout);
    const finding = report.findings.find(({ rule }) => rule === "contract-invalid");
    assert.ok(finding.evidence.messages.some((message) => message.includes("1 to 10")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});


test("rejects unsupported narrative jobs", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-job-enum-"));
  try {
    const input = await writeQualityFixture(root, {
      slides: [{ id: "opening", job: "unsupported-job", family: "statement" }],
    });
    const result = runResult(["quality", "--input", input]);

    assert.equal(result.status, 1);
    assert.notEqual(result.stdout.trim(), "", result.stderr);
    const report = JSON.parse(result.stdout);
    const finding = report.findings.find(({ rule }) => rule === "contract-invalid");
    assert.ok(finding.evidence.messages.some((message) => message.includes("supported narrative job")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});


test("rejects approval dates outside ISO-8601", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-approval-date-"));
  try {
    const input = await writeQualityFixture(root, {
      slides: [{ id: "opening", job: "context", family: "statement" }],
    });
    const decision = {
      status: "approved",
      actor: "Human reviewer",
      decidedAt: "August 26, 2026 12:00 UTC",
      scope: "all-slides",
      evidence: ["review-record"],
    };
    await writeJson(resolve(root, "presentation.approvals.json"), {
      schema: "smartscaile.presentation-approvals.v1",
      content: decision,
      visual: decision,
      freeze: { status: "pending" },
    });
    const result = runResult(["quality", "--input", input]);

    assert.equal(result.status, 1);
    assert.notEqual(result.stdout.trim(), "", result.stderr);
    const report = JSON.parse(result.stdout);
    const finding = report.findings.find(({ rule }) => rule === "approval-invalid");
    assert.ok(finding.evidence.messages.some((message) => message.includes("ISO date-time")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});


test("defers frozen hash validation until technical QA has artifacts", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-freeze-deferral-"));
  try {
    const input = await writeQualityFixture(root, {
      slides: [{ id: "opening", job: "context", family: "statement" }],
    });
    const decision = {
      status: "approved",
      actor: "Human reviewer",
      decidedAt: "2026-08-26T12:00:00Z",
      scope: "all-slides",
      evidence: ["review-record"],
    };
    await writeJson(resolve(root, "presentation.approvals.json"), {
      schema: "smartscaile.presentation-approvals.v1",
      content: decision,
      visual: decision,
      freeze: {
        status: "frozen",
        actor: "Human reviewer",
        decidedAt: "2026-08-26T12:05:00Z",
        scope: "all-artifacts",
        evidence: ["freeze-record"],
        hashes: {
          htmlSha256: "0".repeat(64),
          pdfSha256: "1".repeat(64),
          specSha256: "2".repeat(64),
        },
      },
    });
    const report = JSON.parse(run(["quality", "--input", input]));

    assert.equal(report.technicalQa, "not-run");
    assert.equal(report.systemDiagnostics, "passed");
    assert.equal(report.freeze, "frozen");
    assert.equal(report.deliveryState, "awaiting-technical-qa");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});


test("does not ignore an explicit missing approvals file in legacy mode", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-explicit-approvals-"));
  try {
    run(["scaffold", "--output", root, "--title", "Explicit Approvals"]);
    const input = resolve(root, "presentation.html");
    await rm(resolve(root, "presentation.spec.json"), { force: true });
    await rm(resolve(root, "presentation.approvals.json"), { force: true });
    const result = runResult([
      "quality",
      "--input", input,
      "--approvals", resolve(root, "missing.approvals.json"),
    ]);

    assert.equal(result.status, 1);
    assert.notEqual(result.stdout.trim(), "", result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.compatibilityMode, "contract-v1");
    assert.equal(report.systemDiagnostics, "failed");
    assert.equal(report.deliveryState, "blocked");
    assert.ok(report.findings.some(({ rule }) => rule === "approval-invalid"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});


test("reports eyebrow saturation with numeric evidence", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-eyebrow-saturation-"));
  try {
    const slides = [
      { id: "opening", job: "context", family: "statement" },
      { id: "evidence", job: "proof", family: "evidence" },
      { id: "decision", job: "decision", family: "decision" },
    ];
    const input = await writeQualityFixture(root, {
      slides,
      maxEyebrowRatio: 0.5,
      eyebrowSlides: ["opening", "evidence"],
    });

    const result = runResult(["quality", "--input", input]);
    assert.equal(result.status, 1);
    assert.notEqual(result.stdout.trim(), "", result.stderr);
    const report = JSON.parse(result.stdout);
    const finding = report.findings.find(({ rule }) => rule === "eyebrow-saturation");
    assert.deepEqual(finding.slides, ["opening", "evidence"]);
    assert.equal(finding.evidence.eyebrowSlides, 2);
    assert.equal(finding.evidence.totalSlides, 3);
    assert.equal(finding.evidence.observedRatio, 0.666667);
    assert.equal(finding.evidence.limit, 0.5);
    assert.equal(report.systemDiagnostics, "failed");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});


test("reports technical browser QA failures before creating delivery artifacts", { timeout: 30000 }, async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-technical-failure-"));
  try {
    run(["scaffold", "--output", root, "--title", "Technical Failure"]);
    const input = resolve(root, "presentation.html");
    const specPath = resolve(root, "presentation.spec.json");
    const spec = JSON.parse(await readFile(specPath, "utf8"));
    spec.briefStatus = "ready";
    await writeJson(specPath, spec);
    const source = await readFile(input, "utf8");
    await writeFile(input, source.replace(
      '<div class="slide__footer"><span>Source: Project brief</span><span>01</span></div>',
      '<div style="position:absolute;left:1270px;top:100px;width:100px;height:20px">Overflow</div><div class="slide__footer"><span>Source: Project brief</span><span>01</span></div>',
    ));
    const pdf = resolve(root, "blocked.pdf");
    const html = resolve(root, "blocked.html");
    const result = runResult([
      "export",
      "--input", input,
      "--pdf", pdf,
      "--html", html,
      "--qa-dir", resolve(root, "qa"),
    ]);

    assert.equal(result.status, 1);
    assert.notEqual(result.stdout.trim(), "", result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.technicalQa, "failed");
    assert.equal(report.systemDiagnostics, "passed");
    assert.equal(report.deliveryState, "blocked");
    assert.ok(report.inspection.overflowIssues.length > 0);
    const finding = report.technicalFindings.find(({ rule }) => rule === "layout-overflow");
    assert.equal(finding.evidence.count, report.inspection.overflowIssues.length);
    await assert.rejects(readFile(pdf));
    await assert.rejects(readFile(html));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("blocks a legacy deck when technical browser QA fails", { timeout: 30000 }, async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-legacy-technical-failure-"));
  try {
    run(["scaffold", "--output", root, "--title", "Legacy Technical Failure"]);
    await rm(resolve(root, "presentation.spec.json"), { force: true });
    await rm(resolve(root, "presentation.approvals.json"), { force: true });
    const input = resolve(root, "presentation.html");
    const source = await readFile(input, "utf8");
    await writeFile(input, source.replace(
      '<div class="slide__footer"><span>Source: Project brief</span><span>01</span></div>',
      '<div style="position:absolute;left:1270px;top:100px;width:100px;height:20px">Overflow</div><div class="slide__footer"><span>Source: Project brief</span><span>01</span></div>',
    ));
    const result = runResult([
      "export",
      "--input", input,
      "--pdf", resolve(root, "blocked.pdf"),
      "--html", resolve(root, "blocked.html"),
      "--qa-dir", resolve(root, "qa"),
    ]);

    assert.equal(result.status, 1);
    const report = JSON.parse(result.stdout);
    assert.equal(report.compatibilityMode, "legacy-unverified");
    assert.equal(report.technicalQa, "failed");
    assert.equal(report.deliveryState, "blocked");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});


test("reports PDF inspection failures as technical QA failures", { timeout: 30000 }, async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-pdf-failure-"));
  try {
    run(["scaffold", "--output", root, "--title", "PDF Failure"]);
    const input = resolve(root, "presentation.html");
    const specPath = resolve(root, "presentation.spec.json");
    const spec = JSON.parse(await readFile(specPath, "utf8"));
    spec.briefStatus = "ready";
    await writeJson(specPath, spec);
    const pdf = resolve(root, "invalid.pdf");
    await writeFile(pdf, "not-a-pdf");
    const result = runResult([
      "qa",
      "--input", input,
      "--pdf", pdf,
      "--qa-dir", resolve(root, "qa"),
    ]);

    assert.equal(result.status, 1);
    assert.notEqual(result.stdout.trim(), "", result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.technicalQa, "failed");
    assert.equal(report.systemDiagnostics, "passed");
    assert.equal(report.deliveryState, "blocked");
    assert.equal(report.technicalFindings[0].rule, "pdf-inspection-failed");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});


test("rejects local assets outside the deck directory", { timeout: 30000 }, async () => {
  const outer = await mkdtemp(resolve(tmpdir(), "presentation-runtime-asset-boundary-"));
  const root = resolve(outer, "deck");
  try {
    await mkdir(root);
    await writeFile(resolve(outer, "outside.png"), "private-local-bytes");
    run(["scaffold", "--output", root, "--title", "Asset Boundary"]);
    const input = resolve(root, "presentation.html");
    const specPath = resolve(root, "presentation.spec.json");
    const spec = JSON.parse(await readFile(specPath, "utf8"));
    spec.briefStatus = "ready";
    await writeJson(specPath, spec);
    const source = await readFile(input, "utf8");
    await writeFile(input, source.replace(
      '<div class="slide__footer"><span>Source: Project brief</span><span>01</span></div>',
      '<img src="../outside.png" alt="Outside"><div class="slide__footer"><span>Source: Project brief</span><span>01</span></div>',
    ));
    const html = resolve(root, "shareable.html");
    const result = runResult([
      "export",
      "--input", input,
      "--pdf", resolve(root, "presentation.pdf"),
      "--html", html,
      "--qa-dir", resolve(root, "qa"),
    ]);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /outside the deck directory/);
    await assert.rejects(readFile(html));
  } finally {
    await rm(outer, { recursive: true, force: true });
  }
});


test("rejects executable asset schemes in the shareable HTML", { timeout: 30000 }, async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-asset-scheme-"));
  try {
    run(["scaffold", "--output", root, "--title", "Asset Scheme"]);
    const input = resolve(root, "presentation.html");
    const specPath = resolve(root, "presentation.spec.json");
    const spec = JSON.parse(await readFile(specPath, "utf8"));
    spec.briefStatus = "ready";
    await writeJson(specPath, spec);
    const source = await readFile(input, "utf8");
    await writeFile(input, source.replace(
      '<div class="slide__footer"><span>Source: Project brief</span><span>01</span></div>',
      '<a href="javascript:alert(1)">Unsafe</a><div class="slide__footer"><span>Source: Project brief</span><span>01</span></div>',
    ));
    const html = resolve(root, "shareable.html");
    const result = runResult([
      "export",
      "--input", input,
      "--pdf", resolve(root, "presentation.pdf"),
      "--html", html,
      "--qa-dir", resolve(root, "qa"),
    ]);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /unsupported asset reference scheme/);
    await assert.rejects(readFile(html));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});


test("blocks network access before evaluating deck JavaScript", { timeout: 30000 }, async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-network-block-"));
  const counter = await startRequestCounter(root);
  try {
    const input = await writeQualityFixture(root, {
      slides: [{ id: "opening", job: "context", family: "statement" }],
    });
    const source = await readFile(input, "utf8");
    await writeFile(input, source.replace(
      "</body>",
      `<script>fetch("http://127.0.0.1:${counter.port}/runtime-network-probe").catch(() => {});</script></body>`,
    ));

    const result = runResult(["quality", "--input", input]);
    assert.equal(await counter.count(), 0, "deck JavaScript reached the network during inspection");
    assert.equal(result.status, 1);
    const report = JSON.parse(result.stdout);
    assert.equal(report.systemDiagnostics, "failed");
    assert.ok(report.findings.some(({ rule }) => rule === "remote-resource-reference"));
  } finally {
    counter.close();
    await rm(root, { recursive: true, force: true });
  }
});


test("blocks WebSocket access before evaluating deck JavaScript", { timeout: 30000 }, async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-websocket-block-"));
  const counter = await startRequestCounter(root);
  try {
    const input = await writeQualityFixture(root, {
      slides: [{ id: "opening", job: "context", family: "statement" }],
    });
    const source = await readFile(input, "utf8");
    await writeFile(input, source.replace(
      "</body>",
      `<script>new WebSocket("ws://127.0.0.1:${counter.port}/runtime-websocket-probe");</script></body>`,
    ));

    const result = runResult(["quality", "--input", input]);
    assert.equal(await counter.upgrades(), 0, "deck JavaScript completed a WebSocket handshake during inspection");
    assert.equal(result.status, 1);
    const report = JSON.parse(result.stdout);
    assert.equal(report.systemDiagnostics, "failed");
    assert.ok(report.findings.some(({ rule }) => rule === "remote-resource-reference"));
  } finally {
    counter.close();
    await rm(root, { recursive: true, force: true });
  }
});


test("reports packaging failures and removes partial delivery artifacts", { timeout: 30000 }, async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-packaging-failure-"));
  try {
    run(["scaffold", "--output", root, "--title", "Packaging Failure"]);
    const input = resolve(root, "presentation.html");
    const specPath = resolve(root, "presentation.spec.json");
    const spec = JSON.parse(await readFile(specPath, "utf8"));
    spec.briefStatus = "ready";
    await writeJson(specPath, spec);
    const source = await readFile(input, "utf8");
    await writeFile(input, source.replace(
      '<div class="slide__footer"><span>Source: Project brief</span><span>01</span></div>',
      '<img src="missing.bin" alt="Missing"><div class="slide__footer"><span>Source: Project brief</span><span>01</span></div>',
    ));
    const pdf = resolve(root, "partial.pdf");
    const html = resolve(root, "partial.html");
    const qaDirectory = resolve(root, "qa");
    const result = runResult([
      "export",
      "--input", input,
      "--pdf", pdf,
      "--html", html,
      "--qa-dir", qaDirectory,
    ]);

    assert.equal(result.status, 1);
    assert.notEqual(result.stdout.trim(), "", result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.technicalQa, "failed");
    assert.ok(report.technicalFindings.some(({ rule }) => rule === "packaging-failed"));
    assert.deepEqual(JSON.parse(await readFile(resolve(qaDirectory, "qa-report.json"), "utf8")), report);
    await assert.rejects(readFile(pdf));
    await assert.rejects(readFile(html));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("preserves previous delivery artifacts when forced replacement fails", { timeout: 30000 }, async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-preserve-delivery-"));
  try {
    run(["scaffold", "--output", root, "--title", "Preserve Delivery"]);
    const input = resolve(root, "presentation.html");
    const specPath = resolve(root, "presentation.spec.json");
    const spec = JSON.parse(await readFile(specPath, "utf8"));
    spec.briefStatus = "ready";
    await writeJson(specPath, spec);
    const source = await readFile(input, "utf8");
    await writeFile(input, source.replace(
      '<div class="slide__footer"><span>Source: Project brief</span><span>01</span></div>',
      '<img src="missing.bin" alt="Missing"><div class="slide__footer"><span>Source: Project brief</span><span>01</span></div>',
    ));
    const pdf = resolve(root, "delivery.pdf");
    const html = resolve(root, "delivery.html");
    await writeFile(pdf, "previous-pdf");
    await writeFile(html, "previous-html");

    const result = runResult([
      "export",
      "--input", input,
      "--pdf", pdf,
      "--html", html,
      "--qa-dir", resolve(root, "qa"),
      "--force",
    ]);

    assert.equal(result.status, 1);
    const report = JSON.parse(result.stdout);
    assert.ok(report.technicalFindings.some(({ rule }) => rule === "packaging-failed"));
    assert.equal(await readFile(pdf, "utf8"), "previous-pdf");
    assert.equal(await readFile(html, "utf8"), "previous-html");
    assert.deepEqual(
      (await readdir(root)).filter((name) => /\.(?:stage|backup|tmp)$/.test(name)),
      [],
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});


test("preserves previous delivery when QA report publication is rejected", { timeout: 30000 }, async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-report-rollback-"));
  try {
    for (const mode of ["html-only", "explicit-pdf"]) {
      const deckRoot = resolve(root, mode);
      await mkdir(deckRoot);
      run(["scaffold", "--output", deckRoot, "--title", `Report Rollback ${mode}`]);
      const input = resolve(deckRoot, "presentation.html");
      const specPath = resolve(deckRoot, "presentation.spec.json");
      const spec = JSON.parse(await readFile(specPath, "utf8"));
      spec.briefStatus = "ready";
      await writeJson(specPath, spec);

      const html = resolve(deckRoot, "delivery.html");
      const pdf = resolve(deckRoot, "delivery.pdf");
      const qaDirectory = resolve(deckRoot, "qa");
      const sentinel = resolve(deckRoot, "report-sentinel.json");
      await writeFile(html, "previous-html");
      if (mode === "explicit-pdf") await writeFile(pdf, "previous-pdf");
      await mkdir(qaDirectory);
      await writeFile(sentinel, "report-sentinel");
      await symlink(sentinel, resolve(qaDirectory, "qa-report.json"));

      const args = [
        "export",
        "--input", input,
        "--html", html,
        "--qa-dir", qaDirectory,
        "--force",
      ];
      if (mode === "explicit-pdf") args.push("--pdf", pdf);
      const result = runResult(args);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /refusing symlinked output path/);
      assert.equal(await readFile(html, "utf8"), "previous-html");
      if (mode === "explicit-pdf") assert.equal(await readFile(pdf, "utf8"), "previous-pdf");
      assert.equal(await readFile(sentinel, "utf8"), "report-sentinel");
      const residues = [
        ...(await readdir(deckRoot)),
        ...(await readdir(qaDirectory)),
      ].filter((name) => /\.(?:stage|backup|tmp)$/.test(name));
      assert.deepEqual(residues, []);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});


test("rejects a non-file QA report destination before publishing delivery", { timeout: 30000 }, async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-report-type-"));
  try {
    for (const mode of ["html-only", "explicit-pdf"]) {
      const deckRoot = resolve(root, mode);
      await mkdir(deckRoot);
      run(["scaffold", "--output", deckRoot, "--title", `Report Type ${mode}`]);
      const input = resolve(deckRoot, "presentation.html");
      const specPath = resolve(deckRoot, "presentation.spec.json");
      const spec = JSON.parse(await readFile(specPath, "utf8"));
      spec.briefStatus = "ready";
      await writeJson(specPath, spec);

      const html = resolve(deckRoot, "delivery.html");
      const pdf = resolve(deckRoot, "delivery.pdf");
      const qaDirectory = resolve(deckRoot, "qa");
      const reportPath = resolve(qaDirectory, "qa-report.json");
      await writeFile(html, "previous-html");
      if (mode === "explicit-pdf") await writeFile(pdf, "previous-pdf");
      await mkdir(reportPath, { recursive: true });

      const args = [
        "export",
        "--input", input,
        "--html", html,
        "--qa-dir", qaDirectory,
        "--force",
      ];
      if (mode === "explicit-pdf") args.push("--pdf", pdf);
      const result = runResult(args);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /output path must be a regular file/);
      assert.equal(await readFile(html, "utf8"), "previous-html");
      if (mode === "explicit-pdf") assert.equal(await readFile(pdf, "utf8"), "previous-pdf");
      assert.equal((await lstat(reportPath)).isDirectory(), true);
      await assert.rejects(readdir(resolve(qaDirectory, "browser")));
      const residues = [
        ...(await readdir(deckRoot)),
        ...(await readdir(qaDirectory)),
      ].filter((name) => /\.(?:stage|backup|tmp)$/.test(name));
      assert.deepEqual(residues, []);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});


test("rolls back a non-file QA report destination introduced after preflight", { timeout: 30000 }, async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-report-type-race-"));
  try {
    const deckRoot = resolve(root, "deck");
    run(["scaffold", "--output", deckRoot, "--title", "Report Type Race"]);
    const input = resolve(deckRoot, "presentation.html");
    const specPath = resolve(deckRoot, "presentation.spec.json");
    const spec = JSON.parse(await readFile(specPath, "utf8"));
    spec.briefStatus = "ready";
    await writeJson(specPath, spec);
    const htmlPath = resolve(root, "delivery.html");
    const qaDirectory = resolve(root, "qa");
    const reportPath = resolve(qaDirectory, "qa-report.json");
    await writeFile(htmlPath, "previous-html");

    const child = spawn(process.execPath, [
      runtime,
      "export",
      "--input", input,
      "--html", htmlPath,
      "--qa-dir", qaDirectory,
      "--force",
    ], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });

    const browserDirectory = resolve(qaDirectory, "browser");
    let rendered = false;
    for (let attempt = 0; attempt < 1000; attempt += 1) {
      try {
        if ((await readdir(browserDirectory)).length) {
          rendered = true;
          break;
        }
      } catch {}
      await new Promise((resolveWait) => setTimeout(resolveWait, 5));
    }
    assert.equal(rendered, true, "browser render did not reach the post-preflight seam");
    await mkdir(reportPath);
    const exitCode = await new Promise((resolveExit, rejectExit) => {
      child.once("error", rejectExit);
      child.once("exit", resolveExit);
    });

    assert.equal(exitCode, 1, stderr || stdout);
    assert.match(stderr, /output path must be a regular file/);
    assert.equal(await readFile(htmlPath, "utf8"), "previous-html");
    assert.equal((await lstat(reportPath)).isDirectory(), true);
    const residues = [
      ...(await readdir(root)),
      ...(await readdir(qaDirectory)),
    ].filter((name) => /\.(?:stage|backup|tmp)$/.test(name));
    assert.deepEqual(residues, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});


test("times out unresolved presentation readiness and cleans up Chrome", { timeout: 30000 }, async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-readiness-timeout-"));
  try {
    const input = await writeQualityFixture(root, {
      slides: [{ id: "opening", job: "context", family: "statement" }],
    });
    const source = await readFile(input, "utf8");
    await writeFile(input, source.replace(
      "</body>",
      "<script>window.__presentationReady = new Promise(() => {});</script></body>",
    ));
    const startedAt = Date.now();
    const result = spawnSync(process.execPath, [
      runtime,
      "quality",
      "--input", input,
      "--ready-timeout-ms", "250",
    ], {
      encoding: "utf8",
      env: { ...process.env, TMPDIR: root },
      timeout: 5000,
    });

    assert.notEqual(result.error?.code, "ETIMEDOUT", "runtime did not enforce the readiness deadline");
    assert.equal(result.status, 1);
    assert.ok(Date.now() - startedAt < 5000, "readiness timeout did not stop inspection promptly");
    assert.notEqual(result.stdout.trim(), "", result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.technicalQa, "failed");
    assert.ok(report.technicalFindings.some(({ rule }) => rule === "browser-inspection-failed"));
    assert.deepEqual(
      (await readdir(root)).filter((name) => name.startsWith("presentation-runtime-chrome-")),
      [],
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});


test("forces bounded cleanup when the Chrome launcher ignores SIGTERM", {
  timeout: 30000,
  skip: process.platform === "win32",
}, async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-stubborn-chrome-"));
  const launcher = resolve(root, "stubborn-chrome-wrapper");
  try {
    run(["scaffold", "--output", resolve(root, "deck"), "--title", "Stubborn Chrome"]);
    const input = resolve(root, "deck", "presentation.html");
    const specPath = resolve(root, "deck", "presentation.spec.json");
    const spec = JSON.parse(await readFile(specPath, "utf8"));
    spec.briefStatus = "ready";
    await writeJson(specPath, spec);
    await writeFile(launcher, `#!/bin/sh
trap '' TERM
printf '%s\\n' "$$" > "$PRESENTATION_WRAPPER_PID_FILE"
"$PRESENTATION_REAL_CHROME" "$@" &
chrome_pid=$!
printf '%s\\n' "$chrome_pid" > "$PRESENTATION_CHILD_PID_FILE"
wait "$chrome_pid" || true
while :; do sleep 1; done
`);
    await chmod(launcher, 0o755);

    const startedAt = Date.now();
    const result = spawnSync(process.execPath, [
      runtime,
      "export",
      "--input", input,
      "--html", resolve(root, "delivery.html"),
      "--qa-dir", resolve(root, "qa"),
    ], {
      encoding: "utf8",
      env: {
        ...process.env,
        TMPDIR: root,
        PRESENTATION_CHROME: launcher,
        PRESENTATION_REAL_CHROME: findChromeExecutable(),
        PRESENTATION_WRAPPER_PID_FILE: resolve(root, "wrapper.pid"),
        PRESENTATION_CHILD_PID_FILE: resolve(root, "chrome.pid"),
      },
      timeout: 6000,
    });

    assert.notEqual(result.error?.code, "ETIMEDOUT", "Chrome cleanup exceeded its deadline");
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.ok(Date.now() - startedAt < 6000, "Chrome cleanup was not bounded");
    assert.deepEqual(
      (await readdir(root)).filter((name) => name.startsWith("presentation-runtime-chrome-")),
      [],
    );
    for (const pidFile of ["wrapper.pid", "chrome.pid"]) {
      const pid = Number(await readFile(resolve(root, pidFile), "utf8"));
      assert.throws(() => process.kill(pid, 0), (error) => error.code === "ESRCH");
    }
  } finally {
    spawnSync("pkill", ["-9", "-f", root]);
    await rm(root, { recursive: true, force: true });
  }
});


test("times out a stalled DevTools handshake and cleans up startup resources", {
  timeout: 30000,
  skip: process.platform === "win32",
}, async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-stalled-devtools-"));
  const launcher = resolve(root, "stalled-devtools-chrome");
  try {
    const deckRoot = resolve(root, "deck");
    run(["scaffold", "--output", deckRoot, "--title", "Stalled DevTools"]);
    const input = resolve(deckRoot, "presentation.html");
    const specPath = resolve(deckRoot, "presentation.spec.json");
    const spec = JSON.parse(await readFile(specPath, "utf8"));
    spec.briefStatus = "ready";
    await writeJson(specPath, spec);
    await writeFile(launcher, `#!/usr/bin/env node
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const profileArg = process.argv.find((argument) => argument.startsWith("--user-data-dir="));
const profilePath = profileArg.slice("--user-data-dir=".length);
const heldSockets = new Set();
const server = http.createServer((request, response) => {
  if (request.url === "/json") {
    const port = server.address().port;
    const body = JSON.stringify([{
      type: "page",
      url: "about:blank",
      webSocketDebuggerUrl: "ws://127.0.0.1:" + port + "/devtools/page/stalled",
    }]);
    response.writeHead(200, { "content-type": "application/json", "content-length": Buffer.byteLength(body) });
    response.end(body);
    return;
  }
  response.writeHead(404);
  response.end();
});
server.on("upgrade", (request, socket) => {
  heldSockets.add(socket);
  socket.on("close", () => heldSockets.delete(socket));
});
process.on("SIGTERM", () => {});
server.listen(0, "127.0.0.1", () => {
  fs.writeFileSync(path.join(profilePath, "DevToolsActivePort"), String(server.address().port) + "\\n");
  fs.writeFileSync(process.env.PRESENTATION_HANDSHAKE_PID_FILE, String(process.pid) + "\\n");
});
setInterval(() => {}, 1000);
`);
    await chmod(launcher, 0o755);

    const startedAt = Date.now();
    const result = spawnSync(process.execPath, [
      runtime,
      "export",
      "--input", input,
      "--html", resolve(root, "delivery.html"),
      "--qa-dir", resolve(root, "qa"),
      "--ready-timeout-ms", "1000",
    ], {
      encoding: "utf8",
      env: {
        ...process.env,
        TMPDIR: root,
        PRESENTATION_CHROME: launcher,
        PRESENTATION_HANDSHAKE_PID_FILE: resolve(root, "handshake.pid"),
      },
      timeout: 6000,
    });

    assert.notEqual(result.error?.code, "ETIMEDOUT", "DevTools startup ignored the configured deadline");
    assert.equal(result.status, 1, result.stderr || result.stdout);
    assert.ok(Date.now() - startedAt < 6000, "DevTools startup cleanup was not bounded");
    assert.notEqual(result.stdout.trim(), "", result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.technicalQa, "failed");
    assert.equal(report.deliveryState, "blocked");
    assert.ok(report.technicalFindings.some(({ rule }) => rule === "browser-inspection-failed"));
    assert.deepEqual(
      (await readdir(root)).filter((name) => name.startsWith("presentation-runtime-chrome-")),
      [],
    );
    const pid = Number(await readFile(resolve(root, "handshake.pid"), "utf8"));
    assert.throws(() => process.kill(pid, 0), (error) => error.code === "ESRCH");
  } finally {
    spawnSync("pkill", ["-9", "-f", root]);
    await rm(root, { recursive: true, force: true });
  }
});


test("reports aggregate Chrome cleanup failures as structured technical evidence", {
  timeout: 30000,
  skip: process.platform === "win32" || process.getuid?.() === 0,
}, async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-cleanup-failure-"));
  const profileRoot = resolve(root, "profiles");
  const deckRoot = resolve(root, "deck");
  const qaDirectory = resolve(root, "qa");
  const htmlPath = resolve(root, "delivery.html");
  let child;
  try {
    await mkdir(profileRoot);
    run(["scaffold", "--output", deckRoot, "--title", "Cleanup Failure"]);
    const input = resolve(deckRoot, "presentation.html");
    const specPath = resolve(deckRoot, "presentation.spec.json");
    const spec = JSON.parse(await readFile(specPath, "utf8"));
    spec.briefStatus = "ready";
    await writeJson(specPath, spec);

    child = spawn(process.execPath, [
      runtime,
      "export",
      "--input", input,
      "--html", htmlPath,
      "--qa-dir", qaDirectory,
    ], {
      env: { ...process.env, TMPDIR: profileRoot },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });

    let profileName;
    const profileDeadline = Date.now() + 5000;
    while (!profileName && Date.now() < profileDeadline) {
      profileName = (await readdir(profileRoot)).find((name) => name.startsWith("presentation-runtime-chrome-"));
      if (!profileName) await new Promise((resolveDelay) => setTimeout(resolveDelay, 20));
    }
    assert.ok(profileName, "Chrome profile was not created before the test deadline");
    await chmod(profileRoot, 0o500);

    const [exitCode] = await new Promise((resolveExit, rejectExit) => {
      child.once("close", (...args) => resolveExit(args));
      child.once("error", rejectExit);
    });
    assert.equal(exitCode, 1, stderr || stdout);
    assert.notEqual(stdout.trim(), "", stderr);
    const reportPath = resolve(qaDirectory, "qa-report.json");
    assert.equal(await readFile(reportPath, "utf8"), stdout);
    const report = JSON.parse(stdout);
    assert.equal(report.technicalQa, "failed");
    assert.equal(report.deliveryState, "blocked");
    const finding = report.technicalFindings.find(({ rule }) => rule === "browser-cleanup-failed");
    assert.ok(finding, JSON.stringify(report.technicalFindings));
    assert.ok(Array.isArray(finding.evidence.causes));
    assert.ok(finding.evidence.causes.some(({ code }) => code === "EACCES" || code === "EPERM"));
    await assert.rejects(lstat(htmlPath));
    const processes = spawnSync("ps", ["-axo", "command="], { encoding: "utf8" }).stdout
      .split("\n")
      .filter((line) => line.includes(root));
    assert.deepEqual(processes, []);
  } finally {
    await chmod(profileRoot, 0o700).catch(() => {});
    spawnSync("pkill", ["-9", "-f", root]);
    if (child && child.exitCode === null) child.kill("SIGKILL");
    await rm(root, { recursive: true, force: true });
  }
});


test("keeps approved review artifacts awaiting freeze", { timeout: 30000 }, async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-awaiting-freeze-"));
  try {
    run(["scaffold", "--output", root, "--title", "Awaiting Freeze"]);
    const input = resolve(root, "presentation.html");
    await writeJson(resolve(root, "presentation.spec.json"), {
      schema: "smartscaile.presentation-spec.v1",
      title: "Awaiting Freeze",
      briefStatus: "ready",
      qualityPolicy: { maxConsecutiveFamily: 2, maxEyebrowRatio: 1 },
      slides: [
        { id: "opening", job: "context", family: "statement" },
        { id: "evidence", job: "proof", family: "evidence" },
        { id: "decision", job: "decision", family: "decision" },
      ],
    });
    const approved = {
      status: "approved",
      actor: "Human reviewer",
      decidedAt: "2026-08-26T12:00:00Z",
      scope: "all-slides",
      evidence: ["rendered-review"],
    };
    await writeJson(resolve(root, "presentation.approvals.json"), {
      schema: "smartscaile.presentation-approvals.v1",
      content: approved,
      visual: approved,
      freeze: { status: "pending" },
    });

    const pdf = resolve(root, "Awaiting_Freeze.pdf");
    const html = resolve(root, "Awaiting_Freeze.html");
    const report = JSON.parse(run([
      "export",
      "--input", input,
      "--pdf", pdf,
      "--html", html,
      "--qa-dir", resolve(root, "qa"),
    ]));
    assert.equal("status" in report, false);
    assert.equal(report.technicalQa, "passed");
    assert.equal(report.systemDiagnostics, "passed");
    assert.equal(report.approvals.content, "approved");
    assert.equal(report.approvals.visual, "approved");
    assert.equal(report.freeze, "pending");
    assert.equal(report.deliveryState, "awaiting-freeze");

    const approvalsPath = resolve(root, "presentation.approvals.json");
    const approvals = JSON.parse(await readFile(approvalsPath, "utf8"));
    approvals.freeze = {
      status: "frozen",
      actor: "Human reviewer",
      decidedAt: "2026-08-26T12:30:00Z",
      scope: "delivery-artifacts",
      evidence: ["final-review"],
      hashes: {
        htmlSha256: report.html.sha256,
        pdfSha256: report.pdf.sha256,
        specSha256: report.contract.specSha256,
      },
    };
    await writeJson(approvalsPath, approvals);
    const frozenReport = JSON.parse(run([
      "qa",
      "--input", html,
      "--pdf", pdf,
      "--qa-dir", resolve(root, "qa-frozen"),
    ]));
    assert.equal(frozenReport.freeze, "frozen");
    assert.equal(frozenReport.deliveryState, "frozen");

    approvals.freeze.hashes.htmlSha256 = "0".repeat(64);
    await writeJson(approvalsPath, approvals);
    const invalidResult = runResult([
      "qa",
      "--input", html,
      "--pdf", pdf,
      "--qa-dir", resolve(root, "qa-invalidated"),
    ]);
    assert.equal(invalidResult.status, 1);
    const invalidReport = JSON.parse(invalidResult.stdout);
    assert.equal(invalidReport.freeze, "invalidated");
    assert.equal(invalidReport.deliveryState, "blocked");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("preserves legacy export as unverified", { timeout: 30000 }, async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-legacy-export-"));
  try {
    run(["scaffold", "--output", root, "--title", "Legacy Export"]);
    await rm(resolve(root, "presentation.spec.json"), { force: true });
    await rm(resolve(root, "presentation.approvals.json"), { force: true });
    const input = resolve(root, "presentation.html");
    const html = resolve(root, "Legacy_Export.html");
    const qaDir = resolve(root, "qa");
    const report = JSON.parse(run([
      "export",
      "--input", input,
      "--pdf", resolve(root, "Legacy_Export.pdf"),
      "--html", html,
      "--qa-dir", qaDir,
    ]));

    assert.equal("status" in report, false);
    assert.equal(report.technicalQa, "passed");
    assert.equal(report.systemDiagnostics, "legacy-unverified");
    assert.equal(report.deliveryState, "legacy-unverified");
    const shareable = await readFile(html, "utf8");
    const authoring = await readFile(input, "utf8");
    assert.equal(
      shareable.replace(/(<script id="presentation-pdf-payload"[^>]*>)[A-Za-z0-9+/=]+(<\/script>)/, "$1__PDF_PAYLOAD__$2"),
      authoring,
    );
    assert.equal(report.html.sha256, createHash("sha256").update(shareable).digest("hex"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("exports standalone HTML without generating PDF by default", { timeout: 30000 }, async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-html-first-"));
  try {
    run(["scaffold", "--output", root, "--title", "HTML First"]);
    const input = resolve(root, "presentation.html");
    const specPath = resolve(root, "presentation.spec.json");
    const spec = JSON.parse(await readFile(specPath, "utf8"));
    spec.briefStatus = "ready";
    await writeJson(specPath, spec);
    const html = resolve(root, "HTML_First.html");
    const qaDirectory = resolve(root, "qa");

    const result = runResult([
      "export",
      "--input", input,
      "--html", html,
      "--qa-dir", qaDirectory,
    ]);

    assert.equal(result.status, 0, result.stderr || result.stdout);
    const report = JSON.parse(result.stdout);
    assert.equal(report.technicalQa, "not-run");
    assert.equal(report.systemDiagnostics, "passed");
    assert.equal(report.deliveryState, "awaiting-technical-qa");
    assert.deepEqual(report.outputs, { html });
    assert.equal("pdf" in report, false);
    assert.equal("pdfSha256" in report, false);
    assert.equal("pdfInspection" in report, false);
    const shareable = await readFile(html, "utf8");
    assert.equal(report.html.sha256, createHash("sha256").update(shareable).digest("hex"));
    assert.match(shareable, /id="presentation-download"[^>]*aria-label="Save PDF"/);
    assert.match(shareable, /id="presentation-download-label"[^>]*>Save PDF<\/span>/);
    assert.match(shareable, /window\.print\(\)/);
    assert.doesNotMatch(shareable, /__PDF_PAYLOAD__/);
    assert.deepEqual((await readdir(root)).filter((name) => name.endsWith(".pdf")), []);
    assert.deepEqual(JSON.parse(await readFile(resolve(qaDirectory, "qa-report.json"), "utf8")), report);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("exports and validates a standalone HTML and exact PDF payload", { timeout: 30000 }, async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-export-"));
  try {
    run(["scaffold", "--output", root, "--title", "Export Test"]);
    const input = resolve(root, "presentation.html");
    const specPath = resolve(root, "presentation.spec.json");
    const spec = JSON.parse(await readFile(specPath, "utf8"));
    spec.briefStatus = "ready";
    await writeJson(specPath, spec);
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
    assert.equal("status" in report, false);
    assert.equal(report.technicalQa, "passed");
    assert.equal(report.systemDiagnostics, "passed");
    assert.equal(report.deliveryState, "awaiting-content-approval");
    assert.equal(report.inspection.slideCount, 3);
    assert.equal(report.pdfInspection.pages, 3);
    assert.equal(report.pdfInspection.renderedPages, 3);
    assert.equal(report.pdfInspection.hasType3, false);
    assert.equal(report.pdfSha256, report.embeddedPdfSha256);
    const shareable = await readFile(html, "utf8");
    assert.doesNotMatch(shareable, /__PDF_PAYLOAD__/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});


test("exports byte-identical PDF and HTML for identical inputs", { timeout: 45000 }, async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-deterministic-export-"));
  try {
    run(["scaffold", "--output", root, "--title", "Deterministic Export"]);
    const input = resolve(root, "presentation.html");
    const specPath = resolve(root, "presentation.spec.json");
    const spec = JSON.parse(await readFile(specPath, "utf8"));
    spec.briefStatus = "ready";
    await writeJson(specPath, spec);

    const firstPdf = resolve(root, "first.pdf");
    const firstHtml = resolve(root, "first.html");
    const firstReport = JSON.parse(run([
      "export", "--input", input, "--pdf", firstPdf, "--html", firstHtml, "--qa-dir", resolve(root, "qa-first"),
    ]));
    await new Promise((resolveWait) => setTimeout(resolveWait, 1100));
    const secondPdf = resolve(root, "second.pdf");
    const secondHtml = resolve(root, "second.html");
    const secondReport = JSON.parse(run([
      "export", "--input", input, "--pdf", secondPdf, "--html", secondHtml, "--qa-dir", resolve(root, "qa-second"),
    ]));

    assert.deepEqual(await readFile(secondPdf), await readFile(firstPdf));
    assert.deepEqual(await readFile(secondHtml), await readFile(firstHtml));
    assert.equal(secondReport.pdf.sha256, firstReport.pdf.sha256);
    assert.equal(secondReport.html.sha256, firstReport.html.sha256);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});


test("removes stale managed render captures before export QA", { timeout: 30000 }, async () => {
  const root = await mkdtemp(resolve(tmpdir(), "presentation-runtime-clean-captures-"));
  try {
    run(["scaffold", "--output", root, "--title", "Clean Captures"]);
    const input = resolve(root, "presentation.html");
    const specPath = resolve(root, "presentation.spec.json");
    const spec = JSON.parse(await readFile(specPath, "utf8"));
    spec.briefStatus = "ready";
    await writeJson(specPath, spec);
    const qaDirectory = resolve(root, "qa");
    const browserDirectory = resolve(qaDirectory, "browser");
    const pdfDirectory = resolve(qaDirectory, "pdf");
    await mkdir(browserDirectory, { recursive: true });
    await mkdir(pdfDirectory, { recursive: true });
    await writeFile(resolve(browserDirectory, "browser-99.png"), "stale");
    await writeFile(resolve(pdfDirectory, "pdf-99.png"), "stale");

    const result = runResult([
      "export",
      "--input", input,
      "--pdf", resolve(root, "clean.pdf"),
      "--html", resolve(root, "clean.html"),
      "--qa-dir", qaDirectory,
    ]);

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal((await readdir(browserDirectory)).includes("browser-99.png"), false);
    assert.equal((await readdir(pdfDirectory)).includes("pdf-99.png"), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
