/** Original, identity-neutral mechanics. No component, palette or animation engine is bundled. */
const mounted = new WeakMap();
const linear = value => value;
const finite = (value, name, minimum = 0) => {
  if (!Number.isFinite(value) || value < minimum) throw new TypeError(`${name} must be finite and >= ${minimum}.`);
  return value;
};

/** Build a causal schedule. Time is milliseconds, supplied by the consumer, never a style preset. */
export function compileSequence(input, { hold = 0 } = {}) {
  finite(hold, "hold");
  if (!Array.isArray(input) || !input.length) throw new TypeError("A sequence needs steps.");
  const nodes = new Map();
  for (const step of input) {
    if (!step || typeof step.id !== "string" || !/^[a-z][a-z0-9-]*$/.test(step.id) || nodes.has(step.id)) throw new TypeError("Step IDs must be unique lowercase identifiers.");
    const after = step.after ?? [];
    if (!Array.isArray(after) || after.some(id => typeof id !== "string") || new Set(after).size !== after.length) throw new TypeError("after must contain unique step IDs.");
    nodes.set(step.id, { id: step.id, after: [...after], duration: finite(step.duration, "duration"), delay: finite(step.delay ?? 0, "delay") });
  }
  const visiting = new Set(), resolved = new Map();
  function visit(id) {
    if (resolved.has(id)) return resolved.get(id);
    if (visiting.has(id)) throw new TypeError(`Cyclic dependency: ${id}`);
    const node = nodes.get(id);
    if (!node) throw new TypeError(`Missing dependency: ${id}`);
    visiting.add(id);
    const start = Math.max(0, ...node.after.map(parent => visit(parent).end)) + node.delay;
    const step = Object.freeze({ id, start, end: finite(start + node.duration, "end"), duration: node.duration });
    visiting.delete(id); resolved.set(id, step);
    return step;
  }
  const steps = Object.freeze([...nodes.keys()].map(visit));
  const duration = finite(Math.max(...steps.map(step => step.end)) + hold, "total duration");
  if (duration === 0) throw new TypeError("The total duration must be positive.");
  return Object.freeze({ steps, hold, duration });
}

/** Sample all channels from the same elapsed time. A loop repeats emphasis, not the underlying data. */
export function sampleSequence(plan, elapsed, { loop = false, ease = linear } = {}) {
  if (!Number.isFinite(elapsed)) throw new TypeError("elapsed must be finite.");
  const time = loop ? Math.max(0, elapsed) % plan.duration : Math.max(0, elapsed);
  return Object.fromEntries(plan.steps.map(step => {
    const state = time < step.start ? "pending" : time >= step.end ? "complete" : "active";
    const progress = state === "pending" ? 0 : state === "complete" ? 1 : ease((time - step.start) / step.duration);
    return [step.id, { state, progress }];
  }));
}

/** CSS-compatible cubic Bézier sampling, solving x before evaluating y. No default curve. */
export function cubicBezier(x1, y1, x2, y2) {
  if (![x1, y1, x2, y2].every(Number.isFinite) || x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) throw new TypeError("Invalid cubic Bézier.");
  const coordinate = (t, a, b) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
  return progress => {
    if (!Number.isFinite(progress)) throw new TypeError("progress must be finite.");
    if (progress <= 0) return 0;
    if (progress >= 1) return 1;
    let low = 0, high = 1;
    for (let iteration = 0; iteration < 40; iteration++) {
      const t = (low + high) / 2;
      const x = coordinate(t, x1, x2);
      if (x === progress) return coordinate(t, y1, y2);
      if (x < progress) low = t;
      else high = t;
    }
    return coordinate((low + high) / 2, y1, y2);
  };
}

/** Generic last-request-wins barrier for async measurements, assets or placement. */
export function createCommitGate() {
  let revision = 0, disposed = false;
  return {
    begin() {
      const expected = ++revision;
      return apply => {
        if (disposed || expected !== revision) return false;
        apply(); return true;
      };
    },
    invalidate() { revision++; },
    dispose() { disposed = true; revision++; },
  };
}

/**
 * Optional DOM scene clock. render(elapsedMs) owns only the requested channels.
 * settle() must paint the complete static reading state. onState() must also
 * pause/resume any independent CSS/WAAPI/engine channels owned by this scene.
 * This clock does not claim to suspend another engine's private scheduler.
 */
export function mountScene(root, { render, settle, onState = () => {}, reentry = "resume", active = true, signal } = {}) {
  if (!root?.ownerDocument || typeof render !== "function" || typeof settle !== "function") throw new TypeError("root, render and settle are required.");
  if (!["resume", "restart"].includes(reentry)) throw new TypeError("reentry must be resume or restart.");
  mounted.get(root)?.dispose();
  const doc = root.ownerDocument, win = doc.defaultView;
  const reduce = win?.matchMedia?.("(prefers-reduced-motion: reduce)");
  const print = win?.matchMedia?.("print");
  const supported = Boolean(reduce && win?.IntersectionObserver && win?.requestAnimationFrame && win?.cancelAnimationFrame);
  let disposed = false, visible = false, printing = false, pageHidden = false;
  let fontsReady = !doc.fonts || doc.fonts.status !== "loading", fontsFailed = false;
  let state, elapsed = 0, last = null, frame = null;
  let observer;
  const removers = [];
  const now = () => win.performance.now();
  const cancel = () => {
    if (frame !== null) win.cancelAnimationFrame(frame);
    frame = null;
  };
  const announce = next => {
    if (state === next) return;
    state = next; root.dataset.uiMotion = next; onState(next);
  };
  const arm = () => {
    if (!disposed && state === "running" && frame === null) frame = win.requestAnimationFrame(tick);
  };
  function tick(timestamp) {
    frame = null;
    if (disposed || state !== "running") return;
    elapsed += Math.max(0, timestamp - last); last = timestamp;
    try { render(elapsed); }
    catch (error) { controller.dispose(); throw error; }
    arm();
  }
  function sync() {
    if (disposed) return;
    const next = !supported || fontsFailed || reduce.matches || print?.matches || printing ? "static"
      : active && fontsReady && visible && !doc.hidden && !pageHidden ? "running" : "paused";
    if (next === state) return;
    if (state === "running" && last !== null) elapsed += Math.max(0, now() - last);
    cancel(); last = null;
    if (next === "static" || (next === "paused" && reentry === "restart")) elapsed = 0;
    announce(next);
    if (next === "static") settle();
    if (next === "running" && state === "running" && !disposed) {
      last = now(); arm();
    }
  }
  const listen = (target, event, fn) => {
    target?.addEventListener(event, fn);
    removers.push(() => target?.removeEventListener(event, fn));
  };
  const controller = {
    get state() { return state; },
    get elapsed() { return elapsed; },
    setActive(value) { if (!disposed) { active = Boolean(value); sync(); } },
    dispose() {
      if (disposed) return;
      disposed = true; cancel(); observer?.disconnect();
      removers.forEach(remove => remove());
      announce("static"); settle();
      if (mounted.get(root) === controller) mounted.delete(root);
    },
  };
  mounted.set(root, controller);
  if (supported) {
    observer = new win.IntersectionObserver(entries => {
      if (disposed) return;
      const entry = entries.find(item => item.target === root);
      if (entry) { visible = entry.isIntersecting && entry.intersectionRatio > 0; sync(); }
    }, { threshold: [0, .01] });
    observer.observe(root);
    listen(doc, "visibilitychange", sync);
    listen(reduce, "change", sync); listen(print, "change", sync);
    listen(win, "beforeprint", () => { printing = true; sync(); });
    listen(win, "afterprint", () => { printing = false; sync(); });
    listen(win, "pagehide", () => { pageHidden = true; sync(); });
    listen(win, "pageshow", () => { pageHidden = false; sync(); });
    if (!fontsReady) doc.fonts.ready.then(() => { fontsReady = true; sync(); }, () => { fontsFailed = true; sync(); });
  }
  listen(signal, "abort", controller.dispose);
  if (signal?.aborted) controller.dispose();
  else sync();
  return controller;
}
