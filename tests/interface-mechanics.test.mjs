import assert from "node:assert/strict";
import test from "node:test";
import { compileSequence, sampleSequence, cubicBezier, createCommitGate, mountScene } from "../plugins/brand-runtime/skills/brand/assets/interface/scene-runtime.mjs";

function environment() {
  let time = 0, id = 0;
  const frames = new Map(), observers = new Set();
  const doc = new EventTarget();
  const win = new EventTarget();
  const reduce = Object.assign(new EventTarget(), { matches: false });
  const print = Object.assign(new EventTarget(), { matches: false });
  doc.hidden = false;
  doc.fonts = { status: "loaded", ready: Promise.resolve() };
  win.performance = { now: () => time };
  win.requestAnimationFrame = callback => { frames.set(++id, callback); return id; };
  win.cancelAnimationFrame = key => frames.delete(key);
  win.matchMedia = query => query === "print" ? print : reduce;
  win.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; observers.add(this); }
    observe(root) { this.root = root; }
    disconnect() { observers.delete(this); }
  };
  doc.defaultView = win;
  const root = { ownerDocument: doc, dataset: {} };
  return {
    root, doc, win, reduce, print, frames, observers,
    frame(delta) { time += delta; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(time)); },
    visible(value) { for (const observer of observers) observer.callback([{ target: observer.root, isIntersecting: value, intersectionRatio: value ? 1 : 0 }]); },
    hidden(value) { doc.hidden = value; doc.dispatchEvent(new Event("visibilitychange")); },
    reduced(value) { reduce.matches = value; reduce.dispatchEvent(new Event("change")); },
  };
}

test("DAG causal deriva join, última chegada e hold, sem depender da ordem do array", () => {
  const plan = compileSequence([{ id: "join", after: ["a", "b"], duration: 30 }, { id: "b", after: ["source"], delay: 20, duration: 80 }, { id: "source", duration: 100 }, { id: "a", after: ["source"], duration: 40 }], { hold: 50 });
  assert.equal(plan.duration, 280);
  assert.equal(plan.steps.find(step => step.id === "join").start, 200);
  assert.equal(sampleSequence(plan, 160).join.state, "pending");
  assert.equal(sampleSequence(plan, 215).join.progress, .5);
  assert.ok(Object.values(sampleSequence(plan, 260)).every(step => step.state === "complete"));
  assert.equal(sampleSequence(plan, 285, { loop: true }).source.progress, .05);
  assert.equal(sampleSequence(plan, 10000).join.progress, 1);
});

test("timeline rejeita ciclos, dependência ausente, IDs duplicados e durações inválidas", () => {
  for (const steps of [[], [{ id: "x", duration: -1 }], [{ id: "x", duration: NaN }], [{ id: "x", duration: 1 }, { id: "x", duration: 1 }], [{ id: "x", after: ["absent"], duration: 1 }], [{ id: "x", after: ["y"], duration: 1 }, { id: "y", after: ["x"], duration: 1 }]]) assert.throws(() => compileSequence(steps));
  assert.throws(() => compileSequence([{ id: "a", duration: 1 }], { hold: -1 }));
  const plan = compileSequence([{ id: "a", duration: 0 }], { hold: 1 });
  assert.equal(sampleSequence(plan, 0).a.state, "complete");
  assert.throws(() => sampleSequence(plan, Infinity));
});

test("Bézier inverte x antes de y, preserva extremos e não escolhe uma curva estética", () => {
  const ease = cubicBezier(.25, .1, .25, 1);
  assert.equal(ease(0), 0); assert.equal(ease(1), 1);
  assert.ok(Math.abs(ease(.5) - .8024033876) < 1e-7);
  assert.equal(cubicBezier(0, 0, 1, 1)(.5), .5);
  assert.throws(() => cubicBezier(-1, 0, .3, 1));
});

test("IDs não textuais não são normalizados nem colidem com identificadores literais", () => {
  for (const id of [undefined, null, true, { toString: () => "valid" }]) assert.throws(() => compileSequence([{ id, duration: 1 }]));
  assert.throws(() => compileSequence([{ duration: 1 }, { id: "undefined", duration: 1 }]));
  const plan = compileSequence([{ id: "undefined", duration: 1 }, { id: "null", duration: 2 }]);
  assert.deepEqual(Object.keys(sampleSequence(plan, 0)), ["undefined", "null"]);
});

test("reativação síncrona durante render mantém exatamente um RAF", () => {
  const env = environment(); let reentered = false;
  const scene = mountScene(env.root, { render() {
    if (!reentered) { reentered = true; scene.setActive(false); scene.setActive(true); }
  }, settle() {} });
  env.visible(true); env.frame(100);
  assert.equal(env.frames.size, 1);
  env.frame(100); assert.equal(env.frames.size, 1);
  scene.dispose(); assert.equal(env.frames.size, 0);
});

test("commit gate rejeita conclusões antigas, inclusive depois do cleanup", () => {
  const gate = createCommitGate();
  let value = 0;
  const old = gate.begin(), current = gate.begin();
  assert.equal(old(() => { value = 1; }), false);
  assert.equal(current(() => { value = 2; }), true);
  gate.invalidate(); assert.equal(current(() => { value = 3; }), false);
  const later = gate.begin(); gate.dispose();
  assert.equal(later(() => { value = 4; }), false);
  assert.equal(value, 2);
});

test("scene só inicia visível, pausa trabalho oculto e retoma sem tempo acumulado", () => {
  const env = environment(), paints = [], states = [];
  const scene = mountScene(env.root, { render: t => paints.push(t), settle() {}, onState: state => states.push(state) });
  assert.equal(env.frames.size, 0);
  env.visible(true); env.frame(100); env.frame(100);
  assert.equal(paints.at(-1), 200);
  env.hidden(true); assert.equal(env.frames.size, 0);
  env.frame(4000); assert.equal(paints.at(-1), 200);
  env.hidden(false); env.frame(100); assert.equal(paints.at(-1), 300);
  scene.setActive(false); assert.equal(env.frames.size, 0);
  env.frame(500); scene.setActive(true); env.frame(100);
  assert.equal(paints.at(-1), 400);
  assert.ok(states.includes("paused"));
  scene.dispose(); assert.equal(env.frames.size, 0); assert.equal(env.observers.size, 0);
});

test("reentry restart é explícito, static settle é separado de pause e responde ao vivo", () => {
  const env = environment(), paints = []; let settled = 0;
  const scene = mountScene(env.root, { render: t => paints.push(t), settle: () => settled++, reentry: "restart" });
  env.visible(true); env.frame(100); env.visible(false); env.frame(1000); env.visible(true); env.frame(20);
  assert.equal(paints.at(-1), 20);
  env.reduced(true); assert.equal(env.root.dataset.uiMotion, "static"); assert.equal(env.frames.size, 0); assert.ok(settled > 0);
  env.reduced(false); env.frame(30); assert.equal(paints.at(-1), 30);
  env.win.dispatchEvent(new Event("beforeprint")); assert.equal(env.root.dataset.uiMotion, "static"); assert.equal(env.frames.size, 0);
  env.win.dispatchEvent(new Event("afterprint")); env.frame(10); assert.equal(paints.at(-1), 10);
  scene.dispose(); const count = settled;
  env.visible(true); env.hidden(false); env.reduced(false); env.frame(100);
  assert.equal(settled, count); assert.equal(env.frames.size, 0);
});

test("fontes tardias, init repetido, abort e BFCache não duplicam relógios", async () => {
  const env = environment(); let ready;
  env.doc.fonts = { status: "loading", ready: new Promise(resolve => { ready = resolve; }) };
  let oldPaints = 0, paints = 0;
  const old = mountScene(env.root, { render: () => oldPaints++, settle() {} });
  env.visible(true); assert.equal(env.frames.size, 0);
  const controller = new AbortController();
  const scene = mountScene(env.root, { render: () => paints++, settle() {}, signal: controller.signal });
  ready(); await Promise.resolve(); env.visible(true); env.frame(10);
  assert.equal(oldPaints, 0); assert.equal(paints, 1); assert.equal(env.observers.size, 1);
  env.win.dispatchEvent(new Event("pagehide")); assert.equal(env.frames.size, 0);
  env.win.dispatchEvent(new Event("pageshow")); env.frame(10); assert.equal(paints, 2);
  controller.abort(); assert.equal(env.frames.size, 0); assert.equal(env.observers.size, 0);
  old.dispose(); scene.dispose();
});

test("capability ausente conserva fallback sem instalar timers", () => {
  const env = environment(); delete env.win.IntersectionObserver;
  let settled = 0;
  const scene = mountScene(env.root, { render() { assert.fail("must not animate"); }, settle() { settled++; } });
  assert.equal(env.root.dataset.uiMotion, "static"); assert.equal(env.frames.size, 0); assert.equal(settled, 1);
  scene.dispose(); assert.equal(env.frames.size, 0);
});
