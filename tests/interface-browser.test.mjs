import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(read, accept, timeout = 5000) {
  const end = Date.now() + timeout;
  do { const value = await read(); if (accept(value)) return value; await wait(30); } while (Date.now() < end);
  throw new Error("Browser condition timed out.");
}
function chromePath() {
  const paths = [process.env.PRESENTATION_CHROME, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium", "/usr/bin/google-chrome", "/usr/bin/chromium"].filter(Boolean);
  for (const name of ["google-chrome", "chromium", "chromium-browser"]) {
    const result = spawnSync("which", [name], { encoding: "utf8" });
    if (result.status === 0) paths.push(result.stdout.trim());
  }
  const path = paths.find(existsSync);
  assert.ok(path, "Chrome is required, matching the presentation test prerequisites.");
  return path;
}

test("mecânicas originais renderizam em duas identidades com pausa e fallbacks reais", { timeout: 45000 }, async () => {
  const dir = await mkdtemp(resolve(tmpdir(), "interface-browser-"));
  const evidence = process.env.INTERFACE_QA_DIR ? resolve(process.env.INTERFACE_QA_DIR) : resolve(dir, "evidence");
  await mkdir(evidence, { recursive: true });
  const fixture = await readFile(resolve(root, "tests/fixtures/interface.html"), "utf8");
  const module = await readFile(resolve(root, "plugins/brand-runtime/skills/brand/assets/interface/scene-runtime.mjs"), "utf8");
  assert.equal(fixture.split("__MECHANICS__").length, 2);
  const file = resolve(dir, "index.html");
  await writeFile(file, fixture.replace("__MECHANICS__", module));
  const browser = spawn(chromePath(), ["--headless=new", "--no-sandbox", "--disable-background-networking", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=0", `--user-data-dir=${resolve(dir, "profile")}`, "--proxy-server=http://127.0.0.1:9", "--proxy-bypass-list=<-loopback>", "about:blank"], { stdio: "ignore", detached: process.platform !== "win32" });
  let socket;
  const pending = new Map(); let id = 0;
  const rows = [], errors = [];
  try {
    const port = await until(async () => {
      try { return (await readFile(resolve(dir, "profile/DevToolsActivePort"), "utf8")).split("\n")[0]; } catch { return null; }
    }, Boolean, 10000);
    const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    socket = new WebSocket(tabs.find(tab => tab.type === "page").webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
    socket.addEventListener("message", ({ data }) => {
      const value = JSON.parse(data);
      if (value.method === "Runtime.exceptionThrown") errors.push(value.params.exceptionDetails.text);
      if (value.id && pending.has(value.id)) {
        const request = pending.get(value.id); pending.delete(value.id); clearTimeout(request.timer);
        if (value.error) request.reject(new Error(value.error.message)); else request.resolve(value.result);
      }
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const key = ++id;
      const timer = setTimeout(() => { pending.delete(key); reject(new Error(`CDP timeout: ${method}`)); }, 5000);
      pending.set(key, { resolve, reject, timer }); socket.send(JSON.stringify({ id: key, method, params }));
    });
    const evaluate = async expression => {
      const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
      assert.equal(result.exceptionDetails, undefined, JSON.stringify(result.exceptionDetails));
      return result.result.value;
    };
    const snapshot = () => evaluate(`({width:innerWidth,useful:document.documentElement.clientWidth,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,states:window.__qa?.scenes.map(({mode,last,frames})=>({mode,last,frames})),skins:[...document.querySelectorAll('.variant')].map(el=>({background:getComputedStyle(el).backgroundColor,font:getComputedStyle(el).fontFamily,text:el.innerText})),labels:[...document.querySelectorAll('.node strong,.node p')].map(el=>({text:el.textContent,visible:!!el.getClientRects().length,overflow:el.scrollWidth>el.clientWidth})),complete:[...document.querySelectorAll('.node')].map(el=>el.dataset.complete)})`);
    const capture = async name => {
      const { data } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      await writeFile(resolve(evidence, `${name}.png`), Buffer.from(data, "base64"));
    };
    await send("Page.enable"); await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 1100, deviceScaleFactor: 1, mobile: false });
    await send("Page.navigate", { url: pathToFileURL(file).href });
    await until(() => evaluate("Boolean(window.__qa?.ready)"), Boolean);
    await until(() => evaluate("window.__qa.scenes.every(scene=>scene.frames>1)"), Boolean);
    const first = await snapshot(); await capture("desktop-initial");
    await wait(650); const next = await snapshot(); await capture("desktop-motion");
    assert.equal(first.overflow, false); assert.ok(next.states[0].last > first.states[0].last);
    assert.notEqual(first.skins[0].background, first.skins[1].background);
    assert.notEqual(first.skins[0].font, first.skins[1].font);
    assert.ok(first.labels.every(label => label.visible && !label.overflow));
    rows.push({ case: "desktop-motion", first, next });
    await until(() => evaluate("[...document.querySelectorAll('.node')].every(node=>node.dataset.complete==='true')"), Boolean);
    const completed = await snapshot(); await capture("desktop-hold");
    await wait(160); assert.deepEqual((await snapshot()).complete, completed.complete);
    await until(() => evaluate("document.querySelector('.node').dataset.complete"), value => value === "false");
    const reset = await snapshot(); await capture("desktop-loop-reset");
    assert.ok(reset.states[0].last > completed.states[0].last);
    assert.ok(reset.labels.every(label => label.visible && !label.overflow));
    rows.push({ case: "complete-hold-loop-reset", completed, reset });
    await evaluate("window.__qa.scenes.forEach(scene=>scene.controller.setActive(false))");
    const paused = await snapshot(); await wait(160); const held = await snapshot();
    assert.deepEqual(paused.states, held.states); assert.ok(held.states.every(scene => scene.mode === "paused"));
    await evaluate("window.__qa.scenes.forEach(scene=>scene.controller.setActive(true))");
    await wait(100); assert.ok((await snapshot()).states[0].last > held.states[0].last);
    rows.push({ case: "inactive-resume", paused: held.states });
    for (const width of [320, 390]) {
      await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
      await evaluate("scrollTo(0,0)"); await wait(100);
      const state = await snapshot(); assert.equal(state.overflow, false); assert.ok(state.labels.every(label => !label.overflow));
      await capture(`mobile-${width}`); rows.push({ case: `mobile-${width}`, state });
    }
    await evaluate("scrollTo(0,document.documentElement.scrollHeight)");
    await until(() => evaluate("window.__qa.scenes[0].mode"), value => value === "paused");
    const offscreen = await snapshot(); await wait(120); assert.deepEqual((await snapshot()).states[0], offscreen.states[0]);
    rows.push({ case: "offscreen-pause", state: offscreen.states[0] });
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    await until(() => evaluate("window.__qa.scenes.every(scene=>scene.mode==='static')"), Boolean);
    const reduced = await snapshot(); assert.ok(reduced.complete.every(value => value === "true")); await capture("reduced"); rows.push({ case: "live-reduced", state: reduced });
    await send("Emulation.setEmulatedMedia", { media: "print", features: [] });
    await until(() => evaluate("window.__qa.scenes.every(scene=>scene.mode==='static')"), Boolean);
    const print = await snapshot(); assert.ok(print.complete.every(value => value === "true")); rows.push({ case: "print", state: print });
    await send("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
    await evaluate("scrollTo(0,0)");
    await until(() => evaluate("window.__qa.scenes[0].mode"), value => value === "running");
    await send("Emulation.setScriptExecutionDisabled", { value: true });
    await send("Page.reload", { ignoreCache: true }); await wait(160);
    const nojs = await snapshot(); assert.equal(nojs.states, undefined); assert.ok(nojs.complete.every(value => value === "true")); assert.equal(nojs.overflow, false); await capture("no-javascript"); rows.push({ case: "no-javascript", state: nojs });
    assert.deepEqual(errors, []);
    await writeFile(resolve(evidence, "receipt.json"), JSON.stringify({ browser: "headless Chromium, isolated profile", physicalDevice: false, fpsBenchmark: false, humanApproval: false, cases: rows, errors }, null, 2));
    console.log(`Interface browser evidence: ${evidence}`);
  } finally {
    for (const request of pending.values()) { clearTimeout(request.timer); request.reject(new Error("Browser closed")); }
    socket?.close();
    if (browser.pid) {
      try { if (process.platform === "win32") browser.kill(); else process.kill(-browser.pid, "SIGTERM"); } catch (error) { if (error.code !== "ESRCH") throw error; }
      await wait(180);
      if (browser.exitCode === null && browser.signalCode === null) {
        try { if (process.platform === "win32") browser.kill("SIGKILL"); else process.kill(-browser.pid, "SIGKILL"); } catch (error) { if (error.code !== "ESRCH") throw error; }
      }
    }
    await rm(dir, { recursive: true, force: true });
  }
});
