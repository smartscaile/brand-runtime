#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const starterPath = path.join(skillRoot, "assets", "html-starter", "presentation.html");
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

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

function requireOption(options, key) {
  if (!options[key]) fail(`--${key} is required`);
  return path.resolve(options[key]);
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

function inlineLocalAssets(html, inputPath) {
  const baseDirectory = path.dirname(inputPath);
  const cache = new Map();
  const encodeReference = (reference) => {
    const cleanReference = reference.split("#")[0].split("?")[0];
    if (!cleanReference || /^(?:data:|https?:|blob:|#|javascript:)/i.test(reference)) return reference;
    const absolutePath = path.resolve(baseDirectory, decodeURIComponent(cleanReference));
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
      fail(`local asset was not found: ${reference}`);
    }
    if (!cache.has(absolutePath)) {
      const encoded = fs.readFileSync(absolutePath).toString("base64");
      cache.set(absolutePath, `data:${mimeType(absolutePath)};base64,${encoded}`);
    }
    return cache.get(absolutePath);
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

async function openChrome(documentPath) {
  const port = 9300 + Math.floor(Math.random() * 500);
  const profilePath = fs.mkdtempSync(path.join(os.tmpdir(), "presentation-runtime-chrome-"));
  const browser = spawn(chromePath(), [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--allow-file-access-from-files",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profilePath}`,
    pathToFileURL(documentPath).href,
  ], { stdio: "ignore" });

  let target;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json());
      target = targets.find((item) => item.type === "page" && item.url.startsWith("file:"));
      if (target) break;
    } catch {}
    await delay(100);
  }
  if (!target) {
    browser.kill("SIGTERM");
    fs.rmSync(profilePath, { recursive: true, force: true });
    fail("Chrome DevTools target did not become available.");
  }

  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id || !pending.has(message.id)) return;
    const callbacks = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) callbacks.reject(new Error(message.error.message));
    else callbacks.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });

  await send("Runtime.enable");
  await send("Page.enable");

  return {
    send,
    close() {
      socket.close();
      browser.kill("SIGTERM");
      fs.rmSync(profilePath, { recursive: true, force: true });
    },
  };
}

async function inspectBrowser(documentPath, captureDirectory) {
  const chrome = await openChrome(documentPath);
  try {
    const result = await chrome.send("Runtime.evaluate", {
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
          const effectProperties = ['filter', 'backdropFilter', 'mixBlendMode', 'maskImage', 'webkitMaskImage'];

          slides.forEach((slide, slideIndex) => {
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
          return { slideCount: slides.length, fontsStatus: document.fonts.status, overflowIssues, prohibitedEffects, remoteAssets };
        })()
      `,
    });

    if (captureDirectory) {
      fs.mkdirSync(captureDirectory, { recursive: true });
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
        fs.writeFileSync(path.join(captureDirectory, `browser-${String(index + 1).padStart(2, "0")}.png`), Buffer.from(screenshot.data, "base64"));
      }
    }
    return { chrome, inspection: result.result.value };
  } catch (error) {
    chrome.close();
    throw error;
  }
}

function runRequired(command, args, description) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) fail(`${description} failed: ${result.stderr || result.stdout}`);
  return result.stdout;
}

function inspectPdf(pdfPath, qaDirectory, expectedPages) {
  for (const command of ["pdfinfo", "pdffonts", "pdftoppm"]) {
    if (!commandExists(command)) fail(`${command} is required for PDF validation.`);
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
  fs.mkdirSync(qaDirectory, { recursive: true });
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

function verifyInspection(inspection) {
  if (!inspection.slideCount) fail("no .slide elements were found.");
  if (inspection.fontsStatus !== "loaded") fail(`fonts are not ready: ${inspection.fontsStatus}`);
  if (inspection.overflowIssues.length) fail(`layout QA found ${inspection.overflowIssues.length} overflow issue(s).`);
  if (inspection.prohibitedEffects.length) fail(`export-safe QA found ${inspection.prohibitedEffects.length} prohibited effect(s).`);
}

function embedPdf(inputPath, pdfPath, outputPath) {
  let html = fs.readFileSync(inputPath, "utf8");
  if (!html.includes("__PDF_PAYLOAD__")) fail("the authoring HTML does not contain __PDF_PAYLOAD__.");
  html = inlineLocalAssets(html, inputPath);
  html = html.replace("__PDF_PAYLOAD__", fs.readFileSync(pdfPath).toString("base64"));
  if (/\b(?:src|href)=(['"])https?:/i.test(html) || /url\((['"]?)https?:/i.test(html)) {
    fail("the shareable HTML still contains a remote asset reference.");
  }
  fs.writeFileSync(outputPath, html);
  return html;
}

async function scaffold(options) {
  const outputDirectory = requireOption(options, "output");
  const title = options.title || "Presentation";
  const outputPath = path.join(outputDirectory, "presentation.html");
  if (fs.existsSync(outputPath) && !options.force) fail(`${outputPath} already exists; pass --force only when replacement is intentional.`);
  fs.mkdirSync(outputDirectory, { recursive: true });
  const starter = fs.readFileSync(starterPath, "utf8")
    .replaceAll("__PRESENTATION_TITLE__", escapeHtml(title))
    .replaceAll("__PDF_DOWNLOAD_FILENAME__", `${slugify(title)}.pdf`);
  fs.writeFileSync(outputPath, starter);
  process.stdout.write(`${outputPath}\n`);
}

async function qa(options) {
  const inputPath = requireOption(options, "input");
  const pdfPath = requireOption(options, "pdf");
  const qaDirectory = requireOption(options, "qa-dir");
  const browserDirectory = path.join(qaDirectory, "browser");
  const pdfDirectory = path.join(qaDirectory, "pdf");
  const { chrome, inspection } = await inspectBrowser(inputPath, browserDirectory);
  chrome.close();
  verifyInspection(inspection);
  const pdf = inspectPdf(pdfPath, pdfDirectory, inspection.slideCount);
  if (pdf.pages !== inspection.slideCount) fail(`PDF has ${pdf.pages} pages; expected ${inspection.slideCount}.`);
  if (Math.abs(pdf.ratio - (16 / 9)) > 0.002) fail(`PDF ratio is ${pdf.ratio.toFixed(5)}; expected 16:9.`);
  if (pdf.hasType3) fail("unexpected Type 3 font found in PDF.");
  if (pdf.hasUnembeddedFont) fail("unembedded font found in PDF.");
  if (pdf.renderedPages !== pdf.pages) fail(`rendered ${pdf.renderedPages} PDF pages; expected ${pdf.pages}.`);
  const report = {
    status: "passed",
    input: inputPath,
    pdf: pdfPath,
    pdfSha256: sha256(fs.readFileSync(pdfPath)),
    inspection,
    pdfInspection: pdf,
    manualReview: {
      required: true,
      browserPages: browserDirectory,
      pdfPages: pdfDirectory,
      instruction: "Compare every browser render with its PDF render before delivery.",
    },
  };
  fs.mkdirSync(qaDirectory, { recursive: true });
  fs.writeFileSync(path.join(qaDirectory, "qa-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

async function exportPresentation(options) {
  const inputPath = requireOption(options, "input");
  const pdfPath = requireOption(options, "pdf");
  const htmlPath = requireOption(options, "html");
  const qaDirectory = requireOption(options, "qa-dir");
  for (const outputPath of [pdfPath, htmlPath]) {
    if (fs.existsSync(outputPath) && !options.force) fail(`${outputPath} already exists; pass --force only when replacement is intentional.`);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  }

  const browserDirectory = path.join(qaDirectory, "browser");
  const pdfDirectory = path.join(qaDirectory, "pdf");
  const { chrome, inspection } = await inspectBrowser(inputPath, browserDirectory);
  try {
    verifyInspection(inspection);
    const printed = await chrome.send("Page.printToPDF", {
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      transferMode: "ReturnAsBase64",
    });
    fs.writeFileSync(pdfPath, Buffer.from(printed.data, "base64"));
  } finally {
    chrome.close();
  }

  const pdf = inspectPdf(pdfPath, pdfDirectory, inspection.slideCount);
  if (pdf.pages !== inspection.slideCount) fail(`PDF has ${pdf.pages} pages; expected ${inspection.slideCount}.`);
  if (Math.abs(pdf.ratio - (16 / 9)) > 0.002) fail(`PDF ratio is ${pdf.ratio.toFixed(5)}; expected 16:9.`);
  if (pdf.hasType3 || pdf.hasUnembeddedFont) fail("PDF font validation failed.");
  if (pdf.renderedPages !== pdf.pages) fail("not every PDF page rendered successfully.");

  const html = embedPdf(inputPath, pdfPath, htmlPath);
  const payload = html.match(/<script id="presentation-pdf-payload"[^>]*>([A-Za-z0-9+/=]+)<\/script>/)?.[1];
  if (!payload) fail("embedded PDF payload could not be verified.");
  const pdfHash = sha256(fs.readFileSync(pdfPath));
  const payloadHash = sha256(Buffer.from(payload, "base64"));
  if (pdfHash !== payloadHash) fail("embedded PDF bytes differ from the validated PDF.");

  const report = {
    status: "passed",
    input: inputPath,
    outputs: { pdf: pdfPath, html: htmlPath },
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
  fs.mkdirSync(qaDirectory, { recursive: true });
  fs.writeFileSync(path.join(qaDirectory, "qa-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

const { command, options } = parseArguments(process.argv.slice(2));
if (command === "scaffold") await scaffold(options);
else if (command === "qa") await qa(options);
else if (command === "export") await exportPresentation(options);
else fail("use scaffold, export, or qa.");
