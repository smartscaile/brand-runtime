import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

const hook = resolve(import.meta.dirname, "../plugins/brand-runtime/scripts/brand-command-hook.mjs");

function run(input) {
  const result = spawnSync(process.execPath, [hook], {
    cwd: String(input.cwd || process.cwd()),
    input: JSON.stringify(input),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || `Hook exited with ${result.status}`);
  return result.stdout.trim();
}

function context(output) {
  return JSON.parse(output).hookSpecificOutput?.additionalContext || "";
}

test("activates Brand Runtime only for >>brand and resolves Brand Packs", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "brand-runtime-hook-"));
  try {
    const brandRoot = resolve(root, "brand/checkgrow");
    await mkdir(brandRoot, { recursive: true });
    await writeFile(resolve(brandRoot, "pack.json"), `${JSON.stringify({ brandVersion: "0.5.1", packVersion: "2.0.0" }, null, 2)}\n`);

    assert.equal(run({ cwd: root, prompt: "ordinary prompt" }), "");

    const explicit = context(run({ cwd: root, prompt: ">>brand checkgrow create a document" }));
    assert.match(explicit, /BRAND RUNTIME ACTIVE/);
    assert.match(explicit, /brand\/checkgrow/);
    assert.match(explicit, /validate --brand checkgrow/);

    const automatic = context(run({ cwd: root, prompt: ">>brand" }));
    assert.match(automatic, /brand\/checkgrow/);

    const missing = context(run({ cwd: root, prompt: ">>brand missing" }));
    assert.match(missing, /could not be resolved/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
