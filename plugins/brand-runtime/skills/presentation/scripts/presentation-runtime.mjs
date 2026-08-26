#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const starterDirectory = path.join(skillRoot, "assets", "html-starter");
const starterPaths = Object.freeze({
  html: path.join(starterDirectory, "presentation.html"),
  spec: path.join(starterDirectory, "presentation.spec.json"),
  approvals: path.join(starterDirectory, "presentation.approvals.json"),
});
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const remoteUrlPattern = /^(?:https?|wss?|ftp):/i;

function fail(message) {
  process.stderr.write(`Presentation Runtime: ${message}\n`);
  process.exit(1);
}

function parseArguments(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith("--")) fail(`unexpected argument: ${token}`);
    const key = token.slice(2);
    if (Object.hasOwn(options, key)) fail(`duplicate option --${key}`);
    if (key === "force") {
      options.force = true;
      continue;
    }
    const value = rest[index + 1];
    if (!value || value.startsWith("--")) fail(`missing value for --${key}`);
    options[key] = value;
    index += 1;
  }
  return { command, options };
}

function validateCommandOptions(command, options) {
  const allowedByCommand = {
    scaffold: new Set(["output", "title", "force"]),
    quality: new Set(["input", "spec", "approvals", "ready-timeout-ms"]),
    qa: new Set(["input", "pdf", "qa-dir", "spec", "approvals", "ready-timeout-ms"]),
    export: new Set(["input", "pdf", "html", "qa-dir", "spec", "approvals", "ready-timeout-ms", "force"]),
  };
  const allowed = allowedByCommand[command];
  if (!allowed) return;
  const unknown = Object.keys(options).find((key) => !allowed.has(key));
  if (unknown) fail(`unknown option --${unknown} for ${command}`);
}

function requireOption(options, key) {
  if (!options[key]) fail(`--${key} is required`);
  return path.resolve(options[key]);
}

function rejectSymlinkOutput(outputPath) {
  try {
    const entry = fs.lstatSync(outputPath);
    if (entry.isSymbolicLink()) fail(`refusing symlinked output path: ${outputPath}`);
    if (!entry.isFile()) fail(`output path must be a regular file: ${outputPath}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function temporarySiblingPath(outputPath, suffix = "tmp") {
  return path.join(
    path.dirname(outputPath),
    `.${path.basename(outputPath)}.${process.pid}.${crypto.randomBytes(8).toString("hex")}.${suffix}`,
  );
}

function atomicWriteFile(outputPath, data, { overwrite = true } = {}) {
  const directory = path.dirname(outputPath);
  fs.mkdirSync(directory, { recursive: true });
  const temporaryPath = temporarySiblingPath(outputPath);
  try {
    fs.writeFileSync(temporaryPath, data, { flag: "wx" });
    if (overwrite) {
      try {
        fs.renameSync(temporaryPath, outputPath);
      } catch (error) {
        if (process.platform !== "win32" || !["EEXIST", "EPERM"].includes(error.code)) throw error;
        fs.rmSync(outputPath, { force: true });
        fs.renameSync(temporaryPath, outputPath);
      }
    } else {
      try {
        fs.linkSync(temporaryPath, outputPath);
      } catch (error) {
        if (error.code === "EEXIST") {
          throw new Error(`${outputPath} already exists; pass --force only when replacement is intentional.`);
        }
        throw error;
      }
      fs.rmSync(temporaryPath, { force: true });
    }
  } finally {
    fs.rmSync(temporaryPath, { force: true });
  }
}

function pathEntryExists(filePath) {
  try {
    fs.lstatSync(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function promoteOutputFiles(entries, { overwrite }) {
  const states = entries.map(({ source, destination, overwrite: entryOverwrite }) => ({
    source,
    destination,
    overwrite: entryOverwrite ?? overwrite,
    backup: null,
    promoted: false,
  }));
  let committed = false;
  try {
    for (const state of states.filter(({ overwrite: shouldOverwrite }) => shouldOverwrite)) {
      const backup = temporarySiblingPath(state.destination, "backup");
      try {
        fs.renameSync(state.destination, backup);
        state.backup = backup;
        const backupEntry = fs.lstatSync(backup);
        if (!backupEntry.isFile() && !backupEntry.isSymbolicLink()) {
          throw new Error(`output path must be a regular file: ${state.destination}`);
        }
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
    for (const state of states) {
      if (state.overwrite) {
        fs.renameSync(state.source, state.destination);
        state.promoted = true;
      } else {
        try {
          fs.linkSync(state.source, state.destination);
          state.promoted = true;
        } catch (error) {
          if (error.code === "EEXIST") {
            throw new Error(`${state.destination} already exists; pass --force only when replacement is intentional.`);
          }
          throw error;
        }
      }
    }
    committed = true;
  } catch (error) {
    for (const state of [...states].reverse()) {
      if (state.promoted) fs.rmSync(state.destination, { force: true });
    }
    for (const state of [...states].reverse()) {
      if (state.backup && pathEntryExists(state.backup)) fs.renameSync(state.backup, state.destination);
    }
    throw error;
  } finally {
    for (const state of states) fs.rmSync(state.source, { force: true });
    if (committed) {
      for (const state of states) {
        if (!state.backup) continue;
        try {
          fs.rmSync(state.backup, { force: true });
        } catch (error) {
          process.stderr.write(`Presentation Runtime: committed output; backup cleanup failed: ${error.message}\n`);
        }
      }
    }
  }
}

function readyTimeout(options) {
  const raw = options["ready-timeout-ms"];
  if (raw === undefined) return 15000;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 120000) {
    fail("--ready-timeout-ms must be an integer from 1 to 120000");
  }
  return value;
}

async function withTimeout(promise, milliseconds, message) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), milliseconds);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "Presentation";
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function commandExists(command) {
  return spawnSync("which", [command], { encoding: "utf8" }).status === 0;
}

function chromePath() {
  const candidates = [
    process.env.PRESENTATION_CHROME,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  const resolved = candidates.find((candidate) => fs.existsSync(candidate));
  if (resolved) return resolved;
  for (const command of ["google-chrome", "chromium", "chromium-browser"]) {
    const lookup = spawnSync("which", [command], { encoding: "utf8" });
    if (lookup.status === 0 && lookup.stdout.trim()) return lookup.stdout.trim();
  }
  fail("Chrome or Chromium was not found. Set PRESENTATION_CHROME to an executable path.");
}

function mimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return {
    ".avif": "image/avif",
    ".gif": "image/gif",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".otf": "font/otf",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".ttf": "font/ttf",
    ".webp": "image/webp",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
  }[extension] || "application/octet-stream";
}

function clearManagedCaptures(directory, pattern) {
  fs.mkdirSync(directory, { recursive: true });
  for (const file of fs.readdirSync(directory)) {
    if (pattern.test(file)) fs.rmSync(path.join(directory, file), { force: true });
  }
}

function inlineLocalAssets(html, inputPath) {
  const baseDirectory = path.dirname(inputPath);
  const realBaseDirectory = fs.realpathSync(baseDirectory);
  const cache = new Map();
  const encodeReference = (reference) => {
    const cleanReference = reference.split("#")[0].split("?")[0];
    if (/^(?:javascript|vbscript):/i.test(reference)) throw new Error(`unsupported asset reference scheme: ${reference}`);
    if (!cleanReference || /^(?:data:|https?:|blob:|#)/i.test(reference)) return reference;
    const absolutePath = path.resolve(baseDirectory, decodeURIComponent(cleanReference));
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
      throw new Error(`local asset was not found: ${reference}`);
    }
    const realAssetPath = fs.realpathSync(absolutePath);
    const relativePath = path.relative(realBaseDirectory, realAssetPath);
    const isOutsideDeck = relativePath === ".." || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath);
    if (isOutsideDeck) throw new Error(`local asset is outside the deck directory: ${reference}`);
    if (!cache.has(realAssetPath)) {
      const encoded = fs.readFileSync(realAssetPath).toString("base64");
      cache.set(realAssetPath, `data:${mimeType(realAssetPath)};base64,${encoded}`);
    }
    return cache.get(realAssetPath);
  };

  let output = html.replace(/\b(src|href)=(['"])([^'"]+)\2/gi, (match, attribute, quote, reference) => {
    if (attribute.toLowerCase() === "href" && /^(?:#|mailto:|tel:)/i.test(reference)) return match;
    return `${attribute}=${quote}${encodeReference(reference)}${quote}`;
  });
  output = output.replace(/(?<![A-Za-z0-9_.])url\((['"]?)([^)'"\s]+)\1\)/gi, (match, quote, reference) => {
    return `url("${encodeReference(reference)}")`;
  });
  return output;
}

async function openNetworkSink() {
  const server = net.createServer((socket) => socket.destroy());
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  server.unref();
  let closingPromise = null;
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close() {
      if (!closingPromise) {
        closingPromise = new Promise((resolve, reject) => {
          server.close((error) => {
            if (error && error.code !== "ERR_SERVER_NOT_RUNNING") reject(error);
            else resolve();
          });
        });
      }
      return closingPromise;
    },
  };
}

function childHasExited(child) {
  return child.exitCode !== null || child.signalCode !== null;
}

function waitForChildExit(child, timeoutMs) {
  if (childHasExited(child)) return Promise.resolve(true);
  return new Promise((resolve) => {
    let timer;
    const finish = (exited) => {
      clearTimeout(timer);
      child.removeListener("exit", onExit);
      resolve(exited);
    };
    const onExit = () => finish(true);
    child.once("exit", onExit);
    timer = setTimeout(() => finish(childHasExited(child)), timeoutMs);
  });
}

function signalProcessTree(child, signal) {
  if (!child.pid) return false;
  try {
    if (process.platform === "win32") return child.kill(signal);
    process.kill(-child.pid, signal);
    return true;
  } catch (error) {
    if (error.code === "ESRCH") return false;
    throw error;
  }
}

async function terminateProcessTree(child) {
  if (!child.pid) return;
  signalProcessTree(child, "SIGTERM");
  const exited = await waitForChildExit(child, 750);
  if (process.platform === "win32") {
    if (!exited && child.pid) {
      spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
      if (!childHasExited(child)) child.kill("SIGKILL");
    }
  } else {
    signalProcessTree(child, "SIGKILL");
  }
  if (!childHasExited(child)) await waitForChildExit(child, 750);
  if (!childHasExited(child)) throw new Error("Chrome process tree did not exit within 1500ms.");
}

async function openChrome(documentPath, startupTimeoutMs = 15000) {
  const networkSink = await openNetworkSink();
  const profilePath = fs.mkdtempSync(path.join(os.tmpdir(), "presentation-runtime-chrome-"));
  const debugPortPath = path.join(profilePath, "DevToolsActivePort");
  const browser = spawn(chromePath(), [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--allow-file-access-from-files",
    `--proxy-server=${networkSink.url}`,
    "--proxy-bypass-list=<-loopback>",
    "--remote-debugging-port=0",
    `--user-data-dir=${profilePath}`,
    "about:blank",
  ], { detached: process.platform !== "win32", stdio: "ignore" });

  let socket = null;
  let browserError = null;
  let closingPromise = null;
  browser.once("error", (error) => { browserError = error; });
  try {
  return await withTimeout((async () => {
  let port;
  let target;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (browserError || childHasExited(browser)) break;
    if (!port && fs.existsSync(debugPortPath)) {
      const candidate = Number.parseInt(fs.readFileSync(debugPortPath, "utf8").split(/\r?\n/, 1)[0], 10);
      if (Number.isInteger(candidate) && candidate > 0) port = candidate;
    }
    if (port) {
      try {
        const targets = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json());
        target = targets.find((item) => item.type === "page" && item.url === "about:blank")
          || targets.find((item) => item.type === "page");
        if (target) break;
      } catch {}
    }
    await delay(100);
  }
  if (!target) {
    throw browserError || new Error("Chrome DevTools target did not become available.");
  }

  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  const remoteRequests = [];
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === "Network.requestWillBeSent" && remoteUrlPattern.test(message.params?.request?.url || "")) {
      remoteRequests.push(message.params.request.url);
    }
    if (message.method === "Network.webSocketCreated" && remoteUrlPattern.test(message.params?.url || "")) {
      remoteRequests.push(message.params.url);
    }
    if (message.method === "Fetch.requestPaused" && remoteUrlPattern.test(message.params?.request?.url || "")) {
      remoteRequests.push(message.params.request.url);
      void send("Fetch.failRequest", {
        requestId: message.params.requestId,
        errorReason: "BlockedByClient",
      }).catch(() => {});
    }
    if (!message.id || !pending.has(message.id)) return;
    const callbacks = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) callbacks.reject(new Error(message.error.message));
    else callbacks.resolve(message.result);
  });
  socket.addEventListener("close", () => {
    for (const { reject } of pending.values()) reject(new Error("Chrome DevTools connection closed."));
    pending.clear();
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });

  await send("Runtime.enable");
  await send("Page.enable");
  await send("Network.enable");
  await send("Network.setBlockedURLs", {
    urls: ["http://*", "https://*", "ws://*", "wss://*", "ftp://*"],
  });
  await send("Fetch.enable", {
    patterns: ["http://*", "https://*", "ws://*", "wss://*", "ftp://*"].map((urlPattern) => ({ urlPattern })),
  });
  await send("Page.navigate", { url: pathToFileURL(documentPath).href });

  return { send, remoteRequests, close: closeChrome };
  })(), startupTimeoutMs, `Chrome startup timed out after ${startupTimeoutMs}ms`);
  } catch (error) {
    try {
      await closeChrome();
    } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], "Chrome startup failed and cleanup was incomplete.");
    }
    throw error;
  }

  function closeChrome() {
    if (!closingPromise) {
      closingPromise = (async () => {
        const cleanupErrors = [];
        try {
          if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) socket.close();
        } catch (error) {
          cleanupErrors.push(error);
        }
        try {
          await terminateProcessTree(browser);
        } catch (error) {
          cleanupErrors.push(error);
        }
        try {
          await withTimeout(networkSink.close(), 500, "Network sink did not close within 500ms.");
        } catch (error) {
          cleanupErrors.push(error);
        }
        try {
          fs.rmSync(profilePath, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
        } catch (error) {
          cleanupErrors.push(error);
        }
        if (cleanupErrors.length) {
          throw new AggregateError(cleanupErrors, "Chrome cleanup did not complete successfully.");
        }
      })();
    }
    return closingPromise;
  }
}

async function inspectBrowser(documentPath, captureDirectory, readyTimeoutMs = 15000) {
  const chrome = await openChrome(documentPath, readyTimeoutMs);
  try {
    const result = await withTimeout(chrome.send("Runtime.evaluate", {
      awaitPromise: true,
      returnByValue: true,
      expression: `
        (async () => {
          while (document.readyState !== 'complete') await new Promise(resolve => setTimeout(resolve, 50));
          await document.fonts.ready;
          if (window.__presentationReady && typeof window.__presentationReady.then === 'function') {
            await window.__presentationReady;
          }
          const slides = Array.from(document.querySelectorAll('.slide'));
          const deck = document.querySelector('.presentation-deck, .deck');
          if (deck) deck.style.transform = 'none';
          slides.forEach(slide => { slide.hidden = false; });
          const overflowIssues = [];
          const prohibitedEffects = [];
          const remoteAssets = [];
          const slideMetadata = [];
          const effectProperties = ['filter', 'backdropFilter', 'mixBlendMode', 'maskImage', 'webkitMaskImage'];

          slides.forEach((slide, slideIndex) => {
            slideMetadata.push({
              id: slide.dataset.slideId || '',
              job: slide.dataset.slideJob || '',
              family: slide.dataset.slideFamily || '',
              hasEyebrow: Boolean(slide.querySelector('[data-presentation-role="eyebrow"], .slide__eyebrow')),
            });
            const slideRect = slide.getBoundingClientRect();
            if (Math.abs(slideRect.width - 1280) > 1 || Math.abs(slideRect.height - 720) > 1) {
              overflowIssues.push({ slide: slideIndex + 1, kind: 'canvas-size', width: slideRect.width, height: slideRect.height });
            }
            if (slide.scrollWidth > slide.clientWidth + 1 || slide.scrollHeight > slide.clientHeight + 1) {
              overflowIssues.push({ slide: slideIndex + 1, kind: 'scroll-overflow' });
            }
            for (const element of slide.querySelectorAll('*')) {
              const style = getComputedStyle(element);
              if (style.display === 'none' || style.visibility === 'hidden') continue;
              const rect = element.getBoundingClientRect();
              if (rect.width && rect.height) {
                const outside = rect.left < slideRect.left - 1 || rect.top < slideRect.top - 1 || rect.right > slideRect.right + 1 || rect.bottom > slideRect.bottom + 1;
                if (outside) overflowIssues.push({
                  slide: slideIndex + 1,
                  kind: 'bounds-overflow',
                  element: element.tagName.toLowerCase() + '.' + (typeof element.className === 'string' ? element.className : ''),
                  text: (element.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 90),
                });
              }
              for (const property of effectProperties) {
                const value = style[property];
                const safe = !value || value === 'none' || value === 'normal';
                if (!safe) prohibitedEffects.push({ slide: slideIndex + 1, property, value });
              }
              if (style.boxShadow && style.boxShadow !== 'none') prohibitedEffects.push({ slide: slideIndex + 1, property: 'boxShadow', value: style.boxShadow });
              for (const attribute of ['src', 'href']) {
                const value = element.getAttribute?.(attribute) || '';
                if (/^https?:/i.test(value)) remoteAssets.push({ slide: slideIndex + 1, attribute, value });
              }
            }
          });
          return { slideCount: slides.length, slideMetadata, fontsStatus: document.fonts.status, overflowIssues, prohibitedEffects, remoteAssets };
        })()
      `,
    }), readyTimeoutMs, `presentation readiness timed out after ${readyTimeoutMs}ms`);
    if (result.exceptionDetails || !result.result?.value) {
      throw new Error(result.exceptionDetails?.exception?.description || "browser inspection did not return a result");
    }
    result.result.value.remoteRequests = [...new Set(chrome.remoteRequests)];

    if (captureDirectory) {
      clearManagedCaptures(captureDirectory, /^browser-\d+\.png$/i);
      await chrome.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
      for (let index = 0; index < result.result.value.slideCount; index += 1) {
        await chrome.send("Runtime.evaluate", {
          expression: `
            (() => {
              document.querySelector('.presentation-toolbar, .toolbar')?.style.setProperty('display', 'none', 'important');
              const shell = document.querySelector('.presentation-shell');
              if (shell) { shell.style.padding = '0'; shell.style.display = 'block'; }
              const stage = document.querySelector('.presentation-stage, .stage');
              if (stage) { stage.style.width = '1280px'; stage.style.height = '720px'; }
              const deck = document.querySelector('.presentation-deck, .deck');
              if (deck) deck.style.transform = 'none';
              Array.from(document.querySelectorAll('.slide')).forEach((slide, slideIndex) => { slide.hidden = slideIndex !== ${index}; });
            })()
          `,
        });
        const screenshot = await chrome.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
        atomicWriteFile(
          path.join(captureDirectory, `browser-${String(index + 1).padStart(2, "0")}.png`),
          Buffer.from(screenshot.data, "base64"),
        );
      }
    }
    return { chrome, inspection: result.result.value };
  } catch (error) {
    try {
      await chrome.close();
    } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], "Browser inspection failed and cleanup was incomplete.");
    }
    throw error;
  }
}

const contractSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isoDateTimePattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const narrativeJobs = new Set(["context", "tension", "proof", "mechanism", "comparison", "decision", "transition", "close"]);
const pendingApprovals = Object.freeze({
  schema: "smartscaile.presentation-approvals.v1",
  content: { status: "pending" },
  visual: { status: "pending" },
  freeze: { status: "pending" },
});

const findingMessages = Object.freeze({
  "contract-invalid": "Presentation contract is invalid.",
  "approval-invalid": "Presentation approvals are invalid.",
  "brief-not-ready": "Presentation brief is not ready.",
  "contract-mismatch": "Rendered slide metadata does not match the presentation contract.",
  "consecutive-family-overuse": "A slide family exceeds the configured consecutive-use limit.",
  "eyebrow-saturation": "Eyebrow usage exceeds the configured ratio.",
  "remote-resource-reference": "Presentation references or attempted a remote resource.",
  "slides-missing": "The rendered presentation contains no slides.",
  "fonts-not-ready": "Presentation fonts were not ready during inspection.",
  "layout-overflow": "Rendered slide content exceeds its allowed bounds.",
  "prohibited-export-effect": "The presentation uses an effect prohibited for export.",
  "pdf-page-count-mismatch": "PDF page count does not match the rendered slide count.",
  "pdf-page-ratio-mismatch": "PDF page ratio does not match the presentation canvas.",
  "pdf-type3-font": "PDF contains a Type 3 font.",
  "pdf-unembedded-font": "PDF contains an unembedded font.",
  "pdf-render-incomplete": "Not every PDF page rendered successfully.",
  "browser-inspection-failed": "Browser inspection failed.",
  "browser-cleanup-failed": "Browser cleanup failed.",
  "pdf-inspection-failed": "PDF inspection failed.",
  "packaging-failed": "Delivery packaging failed.",
});

function blockingFinding(rule, slides, evidence) {
  return {
    rule,
    severity: "blocking",
    slides,
    message: findingMessages[rule] || "Presentation quality gate failed.",
    evidence,
  };
}

function validateKeys(value, allowed, location, errors) {
  const unexpected = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unexpected.length) errors.push(`${location} contains unsupported field(s): ${unexpected.join(", ")}`);
}

function isIsoDateTime(value) {
  if (typeof value !== "string") return false;
  const match = value.match(isoDateTimePattern);
  if (!match) return false;
  const [, year, month, day, hour, minute, second] = match.map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return month >= 1 && month <= 12
    && day >= 1 && day <= daysInMonth
    && hour <= 23 && minute <= 59 && second <= 59
    && Number.isFinite(Date.parse(value));
}

function validatePresentationSpec(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return ["root must be an object"];
  validateKeys(value, ["schema", "title", "briefStatus", "qualityPolicy", "slides"], "root", errors);
  if (value.schema !== "smartscaile.presentation-spec.v1") errors.push("schema must be smartscaile.presentation-spec.v1");
  if (typeof value.title !== "string" || !value.title.trim()) errors.push("title must be a non-empty string");
  if (!["draft", "ready"].includes(value.briefStatus)) errors.push("briefStatus must be draft or ready");
  if (!value.qualityPolicy || typeof value.qualityPolicy !== "object" || Array.isArray(value.qualityPolicy)) {
    errors.push("qualityPolicy must be an object");
  } else {
    validateKeys(value.qualityPolicy, ["maxConsecutiveFamily", "maxEyebrowRatio"], "qualityPolicy", errors);
    const consecutive = value.qualityPolicy.maxConsecutiveFamily;
    if (!Number.isInteger(consecutive) || consecutive < 1 || consecutive > 10) {
      errors.push("qualityPolicy.maxConsecutiveFamily must be an integer from 1 to 10");
    }
    const eyebrow = value.qualityPolicy.maxEyebrowRatio;
    if (typeof eyebrow !== "number" || eyebrow < 0 || eyebrow > 1) {
      errors.push("qualityPolicy.maxEyebrowRatio must be a number from 0 to 1");
    }
  }
  if (!Array.isArray(value.slides) || !value.slides.length) {
    errors.push("slides must be a non-empty array");
  } else {
    const ids = new Set();
    value.slides.forEach((slide, index) => {
      const location = `slides[${index}]`;
      if (!slide || typeof slide !== "object" || Array.isArray(slide)) {
        errors.push(`${location} must be an object`);
        return;
      }
      validateKeys(slide, ["id", "job", "family"], location, errors);
      for (const field of ["id", "job", "family"]) {
        if (typeof slide[field] !== "string" || !contractSlugPattern.test(slide[field])) {
          errors.push(`${location}.${field} must be a lowercase slug`);
        }
      }
      if (!narrativeJobs.has(slide.job)) errors.push(`${location}.job must be a supported narrative job`);
      if (ids.has(slide.id)) errors.push(`${location}.id duplicates ${slide.id}`);
      ids.add(slide.id);
    });
  }
  return errors;
}

function validateDecision(value, location, allowedStatuses, errors) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push(`${location} must be an object`);
    return;
  }
  if (!allowedStatuses.includes(value.status)) {
    errors.push(`${location}.status is invalid`);
    return;
  }
  if (value.status === "pending") {
    validateKeys(value, ["status"], location, errors);
    return;
  }
  const allowed = ["status", "actor", "decidedAt", "scope", "evidence"];
  if (value.status === "frozen") allowed.push("hashes");
  validateKeys(value, allowed, location, errors);
  for (const field of ["actor", "scope"]) {
    if (typeof value[field] !== "string" || !value[field].trim()) errors.push(`${location}.${field} must be a non-empty string`);
  }
  if (!isIsoDateTime(value.decidedAt)) {
    errors.push(`${location}.decidedAt must be an ISO date-time`);
  }
  if (!Array.isArray(value.evidence) || !value.evidence.length || value.evidence.some((item) => typeof item !== "string" || !item.trim())) {
    errors.push(`${location}.evidence must contain non-empty strings`);
  }
  if (value.status === "frozen") {
    const hashes = value.hashes;
    if (!hashes || typeof hashes !== "object" || Array.isArray(hashes)) {
      errors.push(`${location}.hashes must be an object`);
    } else {
      validateKeys(hashes, ["htmlSha256", "pdfSha256", "specSha256"], `${location}.hashes`, errors);
      for (const field of ["htmlSha256", "pdfSha256", "specSha256"]) {
        if (!/^[a-f0-9]{64}$/.test(hashes[field] || "")) errors.push(`${location}.hashes.${field} must be a SHA-256 digest`);
      }
    }
  }
}

function validatePresentationApprovals(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return ["root must be an object"];
  validateKeys(value, ["schema", "content", "visual", "freeze"], "root", errors);
  if (value.schema !== "smartscaile.presentation-approvals.v1") errors.push("schema must be smartscaile.presentation-approvals.v1");
  validateDecision(value.content, "content", ["pending", "approved", "rejected", "invalidated"], errors);
  validateDecision(value.visual, "visual", ["pending", "approved", "rejected", "invalidated"], errors);
  validateDecision(value.freeze, "freeze", ["pending", "frozen", "invalidated"], errors);
  return errors;
}

function readJsonDocument(filePath) {
  try {
    const bytes = fs.readFileSync(filePath);
    return { value: JSON.parse(bytes.toString("utf8")), sha256: sha256(bytes) };
  } catch (error) {
    return { error: error.message };
  }
}

function loadPresentationContracts(inputPath, options) {
  const defaultDirectory = path.dirname(inputPath);
  const specPath = options.spec ? path.resolve(options.spec) : path.join(defaultDirectory, "presentation.spec.json");
  const approvalsPath = options.approvals ? path.resolve(options.approvals) : path.join(defaultDirectory, "presentation.approvals.json");
  if (!fs.existsSync(specPath)) {
    if (options.spec) {
      return {
        compatibilityMode: "contract-v1",
        specPath,
        approvalsPath,
        spec: null,
        approvals: pendingApprovals,
        findings: [blockingFinding("contract-invalid", [], { path: specPath, message: "explicit spec file was not found" })],
      };
    }
    if (options.approvals) {
      return {
        compatibilityMode: "contract-v1",
        specPath,
        approvalsPath,
        spec: null,
        approvals: {
          schema: "smartscaile.presentation-approvals.v1",
          content: { status: "invalid" },
          visual: { status: "invalid" },
          freeze: { status: "invalid" },
        },
        findings: [
          blockingFinding("contract-invalid", [], { path: specPath, message: "presentation spec is required when --approvals is provided" }),
          blockingFinding("approval-invalid", [], { path: approvalsPath, message: "explicit approvals file cannot be used without a presentation spec" }),
        ],
      };
    }
    return {
      compatibilityMode: "legacy-unverified",
      specPath: null,
      approvalsPath: null,
      spec: null,
      approvals: pendingApprovals,
      findings: [],
    };
  }

  const findings = [];
  const specDocument = readJsonDocument(specPath);
  let spec = specDocument.value || null;
  const specErrors = specDocument.error ? [specDocument.error] : validatePresentationSpec(spec);
  if (specErrors.length) {
    findings.push(blockingFinding("contract-invalid", [], { path: specPath, messages: specErrors }));
    spec = null;
  }

  let approvals = pendingApprovals;
  if (fs.existsSync(approvalsPath)) {
    const approvalsDocument = readJsonDocument(approvalsPath);
    const approvalErrors = approvalsDocument.error ? [approvalsDocument.error] : validatePresentationApprovals(approvalsDocument.value);
    if (approvalErrors.length) {
      findings.push(blockingFinding("approval-invalid", [], { path: approvalsPath, messages: approvalErrors }));
      approvals = {
        schema: "smartscaile.presentation-approvals.v1",
        content: { status: "invalid" },
        visual: { status: "invalid" },
        freeze: { status: "invalid" },
      };
    } else {
      approvals = approvalsDocument.value;
    }
  } else if (options.approvals) {
    findings.push(blockingFinding("approval-invalid", [], { path: approvalsPath, message: "explicit approvals file was not found" }));
    approvals = {
      schema: "smartscaile.presentation-approvals.v1",
      content: { status: "invalid" },
      visual: { status: "invalid" },
      freeze: { status: "invalid" },
    };
  }

  return {
    compatibilityMode: "contract-v1",
    specPath,
    approvalsPath: fs.existsSync(approvalsPath) ? approvalsPath : null,
    specSha256: specDocument.sha256 || null,
    spec,
    approvals,
    findings,
  };
}

function contractFindings(spec, inspection) {
  const findings = [];
  if (spec.briefStatus !== "ready") {
    findings.push(blockingFinding("brief-not-ready", [], { expected: "ready", observed: spec.briefStatus }));
  }
  const observedSlides = inspection.slideMetadata || [];
  if (observedSlides.length !== spec.slides.length) {
    findings.push(blockingFinding("contract-mismatch", spec.slides.map(({ id }) => id), {
      field: "slideCount",
      expected: spec.slides.length,
      observed: observedSlides.length,
    }));
  }
  const count = Math.min(observedSlides.length, spec.slides.length);
  for (let index = 0; index < count; index += 1) {
    const expected = spec.slides[index];
    const observed = observedSlides[index];
    for (const field of ["id", "job", "family"]) {
      if (expected[field] !== observed[field]) {
        findings.push(blockingFinding("contract-mismatch", [expected.id], {
          field,
          expected: expected[field],
          observed: observed[field],
        }));
      }
    }
  }
  return findings;
}

function consecutiveFamilyFindings(spec) {
  const findings = [];
  for (let start = 0; start < spec.slides.length;) {
    const family = spec.slides[start].family;
    let end = start + 1;
    while (end < spec.slides.length && spec.slides[end].family === family) end += 1;
    const count = end - start;
    if (count > spec.qualityPolicy.maxConsecutiveFamily) {
      findings.push(blockingFinding(
        "consecutive-family-overuse",
        spec.slides.slice(start, end).map(({ id }) => id),
        { family, count, limit: spec.qualityPolicy.maxConsecutiveFamily },
      ));
    }
    start = end;
  }
  return findings;
}

function eyebrowFindings(spec, inspection) {
  const eyebrowSlides = (inspection.slideMetadata || []).filter(({ hasEyebrow }) => hasEyebrow).map(({ id }) => id);
  const observedRatio = inspection.slideCount ? Number((eyebrowSlides.length / inspection.slideCount).toFixed(6)) : 0;
  if (observedRatio <= spec.qualityPolicy.maxEyebrowRatio) return [];
  return [blockingFinding("eyebrow-saturation", eyebrowSlides, {
    eyebrowSlides: eyebrowSlides.length,
    totalSlides: inspection.slideCount,
    observedRatio,
    limit: spec.qualityPolicy.maxEyebrowRatio,
  })];
}

function remoteResourceFindings(inspection) {
  const declared = (inspection.remoteAssets || []).map(({ value }) => value);
  const attempted = inspection.remoteRequests || [];
  const references = [...new Set([...declared, ...attempted])];
  if (!references.length) return [];
  return [blockingFinding(
    "remote-resource-reference",
    [...new Set((inspection.remoteAssets || []).map(({ slide }) => String(slide)))],
    { count: references.length, references },
  )];
}

function resolveFreezeStatus(approvals, hashes) {
  if (approvals.freeze.status !== "frozen") return approvals.freeze.status;
  const expected = approvals.freeze.hashes;
  if (!hashes.htmlSha256 || !hashes.pdfSha256 || !hashes.specSha256) return "frozen";
  if (expected.htmlSha256 !== hashes.htmlSha256 || expected.pdfSha256 !== hashes.pdfSha256 || expected.specSha256 !== hashes.specSha256) {
    return "invalidated";
  }
  return "frozen";
}

function deriveDeliveryState({ compatibilityMode, technicalQa, systemDiagnostics, approvals, freeze }) {
  if (technicalQa === "failed" || systemDiagnostics === "failed") return "blocked";
  if ([approvals.content, approvals.visual, freeze].some((status) => ["invalid", "invalidated", "rejected"].includes(status))) return "blocked";
  if (compatibilityMode === "legacy-unverified") return "legacy-unverified";
  if (systemDiagnostics !== "passed") return "blocked";
  if (technicalQa !== "passed") return "awaiting-technical-qa";
  if (approvals.content !== "approved") return "awaiting-content-approval";
  if (approvals.visual !== "approved") return "awaiting-visual-approval";
  if (freeze !== "frozen") return "awaiting-freeze";
  return "frozen";
}

function buildQualityReport({ inputPath, contracts, inspection, technicalQa = "not-run", hashes = {} }) {
  const findings = [...contracts.findings];
  if (contracts.spec && inspection) {
    findings.push(
      ...contractFindings(contracts.spec, inspection),
      ...consecutiveFamilyFindings(contracts.spec),
      ...eyebrowFindings(contracts.spec, inspection),
    );
  }
  if (inspection) findings.push(...remoteResourceFindings(inspection));
  const hasBlockingFinding = findings.some(({ severity }) => severity === "blocking");
  const systemDiagnostics = hasBlockingFinding
    ? "failed"
    : contracts.compatibilityMode === "legacy-unverified" ? "legacy-unverified" : "passed";
  const approvals = {
    content: contracts.approvals.content.status,
    visual: contracts.approvals.visual.status,
  };
  const freeze = resolveFreezeStatus(contracts.approvals, {
    htmlSha256: hashes.htmlSha256 || sha256(fs.readFileSync(inputPath)),
    pdfSha256: hashes.pdfSha256 || null,
    specSha256: contracts.specSha256,
  });
  const deliveryState = deriveDeliveryState({
    compatibilityMode: contracts.compatibilityMode,
    technicalQa,
    systemDiagnostics,
    approvals,
    freeze,
  });
  return {
    reportSchema: "smartscaile.presentation-quality-report.v1",
    compatibilityMode: contracts.compatibilityMode,
    input: inputPath,
    contract: contracts.specPath ? {
      spec: contracts.specPath,
      approvals: contracts.approvalsPath,
      specSha256: contracts.specSha256,
    } : null,
    technicalQa,
    systemDiagnostics,
    approvals,
    freeze,
    deliveryState,
    findings,
  };
}

async function quality(options) {
  const inputPath = requireOption(options, "input");
  if (!fs.existsSync(inputPath)) fail(`input file was not found: ${inputPath}`);
  const contracts = loadPresentationContracts(inputPath, options);
  let inspection = null;
  if (contracts.spec || contracts.compatibilityMode === "legacy-unverified") {
    try {
      const browserResult = await inspectBrowser(inputPath, undefined, readyTimeout(options));
      inspection = browserResult.inspection;
      if (!await closeChromeOrReport({
        chrome: browserResult.chrome,
        inputPath,
        contracts,
        inspection,
      })) return;
    } catch (error) {
      emitBrowserInspectionFailure({ inputPath, contracts, error });
      return;
    }
  }
  const report = buildQualityReport({ inputPath, contracts, inspection });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.systemDiagnostics === "failed") process.exitCode = 1;
}

function runRequired(command, args, description) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${description} failed: ${result.stderr || result.stdout}`);
  return result.stdout;
}

function inspectPdf(pdfPath, qaDirectory, expectedPages) {
  for (const command of ["pdfinfo", "pdffonts", "pdftoppm"]) {
    if (!commandExists(command)) throw new Error(`${command} is required for PDF validation.`);
  }
  const pdfInfo = runRequired("pdfinfo", [pdfPath], "pdfinfo");
  const pdfFonts = runRequired("pdffonts", [pdfPath], "pdffonts");
  const pages = Number(pdfInfo.match(/^Pages:\s+(\d+)/m)?.[1] || 0);
  const pageSize = pdfInfo.match(/^Page size:\s+([\d.]+) x ([\d.]+) pts/m);
  const width = Number(pageSize?.[1] || 0);
  const height = Number(pageSize?.[2] || 0);
  const ratio = height ? width / height : 0;
  const hasType3 = /Type 3/i.test(pdfFonts);
  const hasUnembeddedFont = pdfFonts.split("\n").some((line) => /\sno\s+(?:yes|no)\s+(?:yes|no)\s+\d+\s+\d+\s*$/.test(line));
  clearManagedCaptures(qaDirectory, /^pdf-\d+\.png$/i);
  runRequired("pdftoppm", ["-png", "-r", "120", pdfPath, path.join(qaDirectory, "pdf")], "PDF page rendering");
  const renderedPages = fs.readdirSync(qaDirectory).filter((file) => /^pdf-\d+\.png$/i.test(file)).length;
  return {
    pages,
    expectedPages,
    pageSizePoints: { width, height },
    ratio,
    hasType3,
    hasUnembeddedFont,
    renderedPages,
    fonts: pdfFonts.trim(),
  };
}

function normalizeGeneratedPdfMetadata(pdfBytes) {
  const source = pdfBytes.toString("latin1");
  const datePattern = /(\/(?:CreationDate|ModDate) \(D:)\d{14}(Z|[+-]\d{2}'\d{2}')(\))/g;
  const matches = [...source.matchAll(datePattern)];
  if (matches.length !== 2) throw new Error("generated PDF does not contain canonical CreationDate and ModDate fields.");
  const normalized = source.replace(datePattern, (_, prefix, timezone, suffix) => `${prefix}19700101000000${timezone}${suffix}`);
  return Buffer.from(normalized, "latin1");
}

function technicalInspectionFindings(inspection) {
  const findings = [];
  if (!inspection.slideCount) findings.push(blockingFinding("slides-missing", [], { observed: 0 }));
  if (inspection.fontsStatus !== "loaded") {
    findings.push(blockingFinding("fonts-not-ready", [], { observed: inspection.fontsStatus }));
  }
  if (inspection.overflowIssues.length) {
    findings.push(blockingFinding(
      "layout-overflow",
      [...new Set(inspection.overflowIssues.map(({ slide }) => String(slide)))],
      { count: inspection.overflowIssues.length },
    ));
  }
  if (inspection.prohibitedEffects.length) {
    findings.push(blockingFinding(
      "prohibited-export-effect",
      [...new Set(inspection.prohibitedEffects.map(({ slide }) => String(slide)))],
      { count: inspection.prohibitedEffects.length },
    ));
  }
  return findings;
}

function technicalPdfFindings(pdf) {
  const findings = [];
  if (pdf.pages !== pdf.expectedPages) {
    findings.push(blockingFinding("pdf-page-count-mismatch", [], { expected: pdf.expectedPages, observed: pdf.pages }));
  }
  if (Math.abs(pdf.ratio - (16 / 9)) > 0.002) {
    findings.push(blockingFinding("pdf-page-ratio-mismatch", [], { expected: 16 / 9, observed: pdf.ratio }));
  }
  if (pdf.hasType3) findings.push(blockingFinding("pdf-type3-font", [], { observed: true }));
  if (pdf.hasUnembeddedFont) findings.push(blockingFinding("pdf-unembedded-font", [], { observed: true }));
  if (pdf.renderedPages !== pdf.pages) {
    findings.push(blockingFinding("pdf-render-incomplete", [], { expected: pdf.pages, observed: pdf.renderedPages }));
  }
  return findings;
}

function packageShareableHtml(inputPath, outputPath, overwrite, pdfPath = null) {
  let html = fs.readFileSync(inputPath, "utf8");
  if (!html.includes("__PDF_PAYLOAD__")) throw new Error("the authoring HTML does not contain __PDF_PAYLOAD__.");
  html = inlineLocalAssets(html, inputPath);
  html = html.replace("__PDF_PAYLOAD__", pdfPath ? fs.readFileSync(pdfPath).toString("base64") : "");
  if (/\b(?:src|href)=(['"])https?:/i.test(html) || /url\((['"]?)https?:/i.test(html)) {
    throw new Error("the shareable HTML still contains a remote asset reference.");
  }
  atomicWriteFile(outputPath, html, { overwrite });
  return html;
}

async function scaffold(options) {
  const outputDirectory = requireOption(options, "output");
  const title = options.title || "Presentation";
  const outputPaths = {
    html: path.join(outputDirectory, "presentation.html"),
    spec: path.join(outputDirectory, "presentation.spec.json"),
    approvals: path.join(outputDirectory, "presentation.approvals.json"),
  };
  for (const outputPath of Object.values(outputPaths)) rejectSymlinkOutput(outputPath);
  const existingPath = Object.values(outputPaths).find((outputPath) => fs.existsSync(outputPath));
  if (existingPath && !options.force) fail(`${existingPath} already exists; pass --force only when replacement is intentional.`);
  fs.mkdirSync(outputDirectory, { recursive: true });
  const html = fs.readFileSync(starterPaths.html, "utf8")
    .replaceAll("__PRESENTATION_TITLE__", escapeHtml(title))
    .replaceAll("__PDF_DOWNLOAD_FILENAME__", `${slugify(title)}.pdf`);
  const spec = JSON.parse(fs.readFileSync(starterPaths.spec, "utf8"));
  spec.title = title;
  const overwrite = Boolean(options.force);
  atomicWriteFile(outputPaths.html, html, { overwrite });
  atomicWriteFile(outputPaths.spec, `${JSON.stringify(spec, null, 2)}\n`, { overwrite });
  atomicWriteFile(outputPaths.approvals, fs.readFileSync(starterPaths.approvals), { overwrite });
  process.stdout.write(`${outputPaths.html}\n`);
}

function emitQaReport(qaDirectory, report) {
  fs.mkdirSync(qaDirectory, { recursive: true });
  const reportPath = path.join(qaDirectory, "qa-report.json");
  rejectSymlinkOutput(reportPath);
  atomicWriteFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  emitQaReportOutput(report);
}

function emitQaReportOutput(report) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.deliveryState === "blocked") process.exitCode = 1;
}

function prepareQaReportPath(qaDirectory) {
  fs.mkdirSync(qaDirectory, { recursive: true });
  const reportPath = path.join(qaDirectory, "qa-report.json");
  rejectSymlinkOutput(reportPath);
  return reportPath;
}

function stageQaReport(reportPath, report) {
  const stagedReportPath = temporarySiblingPath(reportPath, "stage");
  atomicWriteFile(stagedReportPath, `${JSON.stringify(report, null, 2)}\n`, { overwrite: false });
  return stagedReportPath;
}

function emitBrowserInspectionFailure({ qaDirectory, inputPath, contracts, error }) {
  const report = {
    ...buildQualityReport({ inputPath, contracts, inspection: null, technicalQa: "failed" }),
    technicalFindings: [blockingFinding("browser-inspection-failed", [], serializeError(error))],
  };
  if (qaDirectory) emitQaReport(qaDirectory, report);
  else process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exitCode = 1;
}

function serializeError(error) {
  const evidence = {
    name: error?.name || "Error",
    message: error?.message || String(error),
  };
  for (const key of ["code", "errno", "syscall", "path"]) {
    if (["string", "number"].includes(typeof error?.[key])) evidence[key] = error[key];
  }
  if (error instanceof AggregateError) evidence.causes = error.errors.map(serializeError);
  return evidence;
}

function emitBrowserCleanupFailure({ qaDirectory, inputPath, contracts, inspection, error, stagedPaths = [] }) {
  const cleanupErrors = [error];
  for (const stagedPath of stagedPaths.filter(Boolean)) {
    try {
      fs.rmSync(stagedPath, { force: true });
    } catch (stagingError) {
      cleanupErrors.push(stagingError);
    }
  }
  const evidenceError = cleanupErrors.length === 1
    ? error
    : new AggregateError(cleanupErrors, "Chrome and staging cleanup did not complete successfully.");
  const report = {
    ...buildQualityReport({ inputPath, contracts, inspection, technicalQa: "failed" }),
    inspection,
    technicalFindings: [blockingFinding("browser-cleanup-failed", [], serializeError(evidenceError))],
  };
  if (qaDirectory) emitQaReport(qaDirectory, report);
  else process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exitCode = 1;
}

async function closeChromeOrReport({ chrome, qaDirectory, inputPath, contracts, inspection, stagedPaths, priorError }) {
  try {
    await chrome.close();
    return true;
  } catch (cleanupError) {
    const error = priorError
      ? new AggregateError([priorError, cleanupError], "Browser operation failed and cleanup was incomplete.")
      : cleanupError;
    emitBrowserCleanupFailure({ qaDirectory, inputPath, contracts, inspection, error, stagedPaths });
    return false;
  }
}

function emitTechnicalInspectionFailure({ qaDirectory, inputPath, contracts, inspection }) {
  const technicalFindings = technicalInspectionFindings(inspection);
  if (!technicalFindings.length) return false;
  emitQaReport(qaDirectory, {
    ...buildQualityReport({ inputPath, contracts, inspection, technicalQa: "failed" }),
    inspection,
    technicalFindings,
  });
  process.exitCode = 1;
  return true;
}

function emitTechnicalPdfFailure({ qaDirectory, inputPath, contracts, inspection, pdfPath, pdfInspection, error, removePdf = false }) {
  const pdfSha256 = fs.existsSync(pdfPath) ? sha256(fs.readFileSync(pdfPath)) : null;
  const technicalFindings = error
    ? [blockingFinding("pdf-inspection-failed", [], { message: error.message })]
    : technicalPdfFindings(pdfInspection);
  if (!technicalFindings.length) return false;
  const report = {
    ...buildQualityReport({ inputPath, contracts, inspection, technicalQa: "failed", hashes: { pdfSha256 } }),
    inspection,
    technicalFindings,
  };
  if (pdfSha256 && !removePdf) {
    report.pdf = { path: pdfPath, sha256: pdfSha256 };
    report.pdfSha256 = pdfSha256;
  }
  if (pdfInspection) report.pdfInspection = pdfInspection;
  emitQaReport(qaDirectory, report);
  if (removePdf) fs.rmSync(pdfPath, { force: true });
  process.exitCode = 1;
  return true;
}

function emitTechnicalPackagingFailure({ qaDirectory, inputPath, contracts, inspection, pdfPath, htmlPath, pdfInspection, error }) {
  const pdfSha256 = pdfPath && fs.existsSync(pdfPath) ? sha256(fs.readFileSync(pdfPath)) : null;
  for (const outputPath of [pdfPath, htmlPath].filter(Boolean)) fs.rmSync(outputPath, { force: true });
  const report = {
    ...buildQualityReport({ inputPath, contracts, inspection, technicalQa: "failed", hashes: { pdfSha256 } }),
    inspection,
    pdfInspection,
    technicalFindings: [blockingFinding("packaging-failed", [], { message: error.message })],
  };
  process.stderr.write(`Presentation Runtime: ${error.message}\n`);
  emitQaReport(qaDirectory, report);
  process.exitCode = 1;
}

async function qa(options) {
  const inputPath = requireOption(options, "input");
  const pdfPath = requireOption(options, "pdf");
  const qaDirectory = requireOption(options, "qa-dir");
  const browserDirectory = path.join(qaDirectory, "browser");
  const pdfDirectory = path.join(qaDirectory, "pdf");
  const contracts = loadPresentationContracts(inputPath, options);
  let browserResult;
  try {
    browserResult = await inspectBrowser(inputPath, browserDirectory, readyTimeout(options));
  } catch (error) {
    emitBrowserInspectionFailure({ qaDirectory, inputPath, contracts, error });
    return;
  }
  const { chrome, inspection } = browserResult;
  if (!await closeChromeOrReport({ chrome, qaDirectory, inputPath, contracts, inspection })) return;
  const systemReport = buildQualityReport({ inputPath, contracts, inspection });
  if (systemReport.systemDiagnostics === "failed") {
    emitQaReport(qaDirectory, { ...systemReport, inspection });
    process.exitCode = 1;
    return;
  }
  if (emitTechnicalInspectionFailure({ qaDirectory, inputPath, contracts, inspection })) return;
  let pdf;
  try {
    pdf = inspectPdf(pdfPath, pdfDirectory, inspection.slideCount);
  } catch (error) {
    emitTechnicalPdfFailure({ qaDirectory, inputPath, contracts, inspection, pdfPath, error });
    return;
  }
  if (emitTechnicalPdfFailure({ qaDirectory, inputPath, contracts, inspection, pdfPath, pdfInspection: pdf })) return;
  const pdfSha256 = sha256(fs.readFileSync(pdfPath));
  const report = {
    ...buildQualityReport({ inputPath, contracts, inspection, technicalQa: "passed", hashes: { pdfSha256 } }),
    pdf: { path: pdfPath, sha256: pdfSha256 },
    html: { path: inputPath, sha256: sha256(fs.readFileSync(inputPath)) },
    pdfSha256,
    inspection,
    pdfInspection: pdf,
    manualReview: {
      required: true,
      browserPages: browserDirectory,
      pdfPages: pdfDirectory,
      instruction: "Compare every browser render with its PDF render before delivery.",
    },
  };
  emitQaReport(qaDirectory, report);
}

async function exportPresentation(options) {
  const inputPath = requireOption(options, "input");
  const pdfPath = options.pdf ? path.resolve(options.pdf) : null;
  const htmlPath = requireOption(options, "html");
  const qaDirectory = requireOption(options, "qa-dir");
  for (const outputPath of [pdfPath, htmlPath].filter(Boolean)) {
    rejectSymlinkOutput(outputPath);
    if (fs.existsSync(outputPath) && !options.force) fail(`${outputPath} already exists; pass --force only when replacement is intentional.`);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  }
  const reportPath = prepareQaReportPath(qaDirectory);
  const stagedPdfPath = pdfPath ? temporarySiblingPath(pdfPath, "stage") : null;
  const stagedHtmlPath = temporarySiblingPath(htmlPath, "stage");

  const browserDirectory = path.join(qaDirectory, "browser");
  const pdfDirectory = path.join(qaDirectory, "pdf");
  const contracts = loadPresentationContracts(inputPath, options);
  let browserResult;
  try {
    browserResult = await inspectBrowser(inputPath, browserDirectory, readyTimeout(options));
  } catch (error) {
    emitBrowserInspectionFailure({ qaDirectory, inputPath, contracts, error });
    return;
  }
  const { chrome, inspection } = browserResult;
  const systemReport = buildQualityReport({ inputPath, contracts, inspection });
  if (systemReport.systemDiagnostics === "failed") {
    if (!await closeChromeOrReport({ chrome, qaDirectory, inputPath, contracts, inspection })) return;
    emitQaReport(qaDirectory, { ...systemReport, inspection });
    process.exitCode = 1;
    return;
  }
  if (technicalInspectionFindings(inspection).length) {
    if (!await closeChromeOrReport({ chrome, qaDirectory, inputPath, contracts, inspection })) return;
    emitTechnicalInspectionFailure({ qaDirectory, inputPath, contracts, inspection });
    return;
  }
  if (!pdfPath) {
    if (!await closeChromeOrReport({
      chrome,
      qaDirectory,
      inputPath,
      contracts,
      inspection,
      stagedPaths: [stagedHtmlPath],
    })) return;
    try {
      const html = packageShareableHtml(inputPath, stagedHtmlPath, false);
      const htmlHash = sha256(Buffer.from(html));
      const report = {
        ...buildQualityReport({
          inputPath,
          contracts,
          inspection,
          hashes: { htmlSha256: htmlHash },
        }),
        outputs: { html: htmlPath },
        html: { path: htmlPath, sha256: htmlHash },
        inspection,
        manualReview: {
          required: true,
          browserPages: browserDirectory,
          instruction: "Review every browser render; use Save PDF in the standalone HTML when a PDF is needed.",
        },
      };
      const stagedReportPath = stageQaReport(reportPath, report);
      promoteOutputFiles([
        { source: stagedHtmlPath, destination: htmlPath },
        { source: stagedReportPath, destination: reportPath, overwrite: true },
      ], { overwrite: Boolean(options.force) });
      emitQaReportOutput(report);
    } catch (error) {
      emitTechnicalPackagingFailure({
        qaDirectory,
        inputPath,
        contracts,
        inspection,
        pdfPath: null,
        htmlPath: stagedHtmlPath,
        pdfInspection: null,
        error,
      });
      return;
    }
    return;
  }
  let printError = null;
  try {
    const printed = await chrome.send("Page.printToPDF", {
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      transferMode: "ReturnAsBase64",
    });
    const normalizedPdf = normalizeGeneratedPdfMetadata(Buffer.from(printed.data, "base64"));
    atomicWriteFile(stagedPdfPath, normalizedPdf, { overwrite: false });
  } catch (error) {
    printError = error;
  }
  if (!await closeChromeOrReport({
    chrome,
    qaDirectory,
    inputPath,
    contracts,
    inspection,
    stagedPaths: [stagedPdfPath, stagedHtmlPath],
    priorError: printError,
  })) return;
  if (printError) {
    emitTechnicalPackagingFailure({
      qaDirectory,
      inputPath,
      contracts,
      inspection,
      pdfPath: stagedPdfPath,
      htmlPath: stagedHtmlPath,
      pdfInspection: null,
      error: printError,
    });
    return;
  }

  let pdf;
  try {
    pdf = inspectPdf(stagedPdfPath, pdfDirectory, inspection.slideCount);
  } catch (error) {
    emitTechnicalPdfFailure({
      qaDirectory,
      inputPath,
      contracts,
      inspection,
      pdfPath: stagedPdfPath,
      error,
      removePdf: true,
    });
    return;
  }
  if (emitTechnicalPdfFailure({
    qaDirectory,
    inputPath,
    contracts,
    inspection,
    pdfPath: stagedPdfPath,
    pdfInspection: pdf,
    removePdf: true,
  })) return;

  let html;
  let pdfHash;
  let payloadHash;
  let htmlHash;
  try {
    html = packageShareableHtml(inputPath, stagedHtmlPath, false, stagedPdfPath);
    const payload = html.match(/<script id="presentation-pdf-payload"[^>]*>([A-Za-z0-9+/=]+)<\/script>/)?.[1];
    if (!payload) throw new Error("embedded PDF payload could not be verified.");
    pdfHash = sha256(fs.readFileSync(stagedPdfPath));
    payloadHash = sha256(Buffer.from(payload, "base64"));
    if (pdfHash !== payloadHash) throw new Error("embedded PDF bytes differ from the validated PDF.");
    htmlHash = sha256(Buffer.from(html));
  } catch (error) {
    emitTechnicalPackagingFailure({
      qaDirectory,
      inputPath,
      contracts,
      inspection,
      pdfPath: stagedPdfPath,
      htmlPath: stagedHtmlPath,
      pdfInspection: pdf,
      error,
    });
    return;
  }

  const report = {
    ...buildQualityReport({
      inputPath,
      contracts,
      inspection,
      technicalQa: "passed",
      hashes: { htmlSha256: htmlHash, pdfSha256: pdfHash },
    }),
    outputs: { pdf: pdfPath, html: htmlPath },
    pdf: { path: pdfPath, sha256: pdfHash },
    html: { path: htmlPath, sha256: htmlHash },
    pdfSha256: pdfHash,
    embeddedPdfSha256: payloadHash,
    inspection,
    pdfInspection: pdf,
    manualReview: {
      required: true,
      browserPages: browserDirectory,
      pdfPages: pdfDirectory,
      instruction: "Compare every browser render with its PDF render before delivery.",
    },
  };
  try {
    const stagedReportPath = stageQaReport(reportPath, report);
    promoteOutputFiles([
      { source: stagedPdfPath, destination: pdfPath },
      { source: stagedHtmlPath, destination: htmlPath },
      { source: stagedReportPath, destination: reportPath, overwrite: true },
    ], { overwrite: Boolean(options.force) });
    emitQaReportOutput(report);
  } catch (error) {
    emitTechnicalPackagingFailure({
      qaDirectory,
      inputPath,
      contracts,
      inspection,
      pdfPath: stagedPdfPath,
      htmlPath: stagedHtmlPath,
      pdfInspection: pdf,
      error,
    });
  }
}

const { command, options } = parseArguments(process.argv.slice(2));
validateCommandOptions(command, options);
if (command === "scaffold") await scaffold(options);
else if (command === "quality") await quality(options);
else if (command === "qa") await qa(options);
else if (command === "export") await exportPresentation(options);
else fail("use scaffold, quality, qa, or export.");
