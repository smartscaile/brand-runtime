import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { lstat, mkdir, mkdtemp, open, opendir, readFile, realpath, rename, rm, symlink, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { isAbsolute, relative, resolve, sep } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const forbiddenPaths = [
  ".specsfy",
  ".agents/skills",
  "specs",
  "specs.md",
  "skills-lock.json",
];
const approvedBinaryFiles = new Map([
  ["plugins/brand-runtime/assets/icon.png", "46add6f958b5cf88a4e5e6451920da343454d14edcb3523350dca817fe92a9cc"],
  ["plugins/brand-runtime/assets/logo-dark.png", "accf673c3f6a21051c461d64e19eabae9be463eb711db763adaf62c24bf829e3"],
  ["plugins/brand-runtime/assets/logo.png", "accf673c3f6a21051c461d64e19eabae9be463eb711db763adaf62c24bf829e3"],
]);
const guardPath = "tests/no-legacy-framework-critical-path.test.mjs";
const retiredFrameworkPattern = new RegExp(["spec", "sfy"].join(""), "i");
const expectedGuardLegacyLineHashes = [
  "5323cc482fea1fb8b6ba2b14e1cf775875c6daafe9f183b2edbf9c7aa37d8f3d",
  "94a0eed95eee14fbe872533a860644aa1123d8ed7272236758ec37fc3e7cc141",
  "86c8e9783b75c560d31566df841eb2e94e6e2647b26212145917ab823d9493eb",
  "cff9ef5ab1c7e91ef2a74c48bc0759b1260aebb15dc58025b8b02d47ee7433ad",
  "38f67e320b08409c3e7b3ca511ca745f1377ad285854cc44a74bc95288ea8a97",
  "e744d401648cfb8160580bb8bb7ac470f1697f1560ed28e9e3953a2e086e8686",
  "59163097e728a0c743bbead167e9ea02f3e58d770f7df39b5e0de0b80c2f0724",
  "8afd1a8ffc83f63c6986f3bc3bf1c2594ff6783c88fe52f4b73259e20aafcec4",
  "8afd1a8ffc83f63c6986f3bc3bf1c2594ff6783c88fe52f4b73259e20aafcec4",
  "9d59ed914953a0af575321ff1475e045fa2f45b5f8fb8f7c78472f032898f559",
  "941ea09d8a9e98f60c660b579d2a4f3ba7c9c0c5e56cc4bb70ad2fee14243792",
  "69e4b87bc75bacb3842245dee74db4080c739c54b9c0910096dd063ad36d45f0",
  "cf867575f7682ae1e305d1012b2eef535c7b45965372f97cf0bcd1208491202c",
  "dc7bca324b45a32ea9b4defd95e07868d3f7c6c0b75f100653eb68df210539b2",
  "7f6d71851de4875e5db37b2803160ba1c3b1cc82bd0a8d242977804aff36c610",
  "4b55e04a3ff01d06d986f8a4bb62909d2bf2f2277cdc0fd88b7c009006bb61b6",
  "9aed5fe11b60d7f0359c690fe460e01e27fcddbca6c6a36808ac4d029dc87f1c",
].sort();

function assertNoUnexpectedLegacyText(path, content) {
  const occurrences = content.match(new RegExp(retiredFrameworkPattern.source, "gi")) ?? [];
  if (path === guardPath) {
    const hashes = content
      .split("\n")
      .filter((line) => retiredFrameworkPattern.test(line))
      .map((line) => createHash("sha256").update(line.trim()).digest("hex"))
      .sort();
    if (JSON.stringify(hashes) !== JSON.stringify(expectedGuardLegacyLineHashes)) {
      throw new Error(`Guard self-test literal budget changed: ${occurrences.length}`);
    }
    return;
  }
  if (occurrences.length) {
    throw new Error(`Retired framework reference found in critical path: ${path}`);
  }
}

test("inventories canonical files from the complete Git-visible working tree", () => {
  const files = listRepositoryFiles(root);
  for (const path of [
    "AGENTS.md",
    ".agents/plugins/marketplace.json",
    ".claude-plugin/marketplace.json",
    "docs/decisions.md",
    "package.json",
    "plugins/brand-runtime/skills/presentation/SKILL.md",
    "scripts/validate-repository.mjs",
    "tests/hermes-managed-release.test.mjs",
  ]) {
    assert.ok(files.includes(path), `${path} must be inventoried`);
  }
});

test("subtracts deleted files while retaining untracked files", async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "legacy-framework-deleted-untracked-"));
  try {
    assert.equal(spawnSync("git", ["init", "-q"], { cwd: directory }).status, 0);
    await writeFile(resolve(directory, "deleted.md"), "tracked", "utf8");
    assert.equal(spawnSync("git", ["add", "deleted.md"], { cwd: directory }).status, 0);
    await rm(resolve(directory, "deleted.md"));
    await writeFile(resolve(directory, "untracked.weirdext"), "untracked", "utf8");
    const files = listRepositoryFiles(directory);
    assert.equal(files.includes("deleted.md"), false);
    assert.equal(files.includes("untracked.weirdext"), true);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("scans UTF-8 files even when their extension is unknown", async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "legacy-framework-unknown-extension-"));
  try {
    assert.equal(spawnSync("git", ["init", "-q"], { cwd: directory }).status, 0);
    await writeFile(resolve(directory, "legacy.weirdext"), "Specsfy", "utf8");
    const files = await collectRepositoryTextFiles(directory);
    assert.equal(files.find(({ path }) => path === "legacy.weirdext")?.content, "Specsfy");
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects C0 DEL and C1 controls outside the binary allowlist", async () => {
  const cases = [
    ["NUL", Buffer.from([0])],
    ["C0", Buffer.from([1])],
    ["DEL", Buffer.from([127])],
    ["C1-U+0080", Buffer.from("\u0080", "utf8")],
    ["C1-U+0085-hidden-term", Buffer.from("spec\u0085sfy", "utf8")],
    ["C1-U+009F", Buffer.from("\u009f", "utf8")],
  ];

  for (const [label, payload] of cases) {
    const directory = await mkdtemp(resolve(tmpdir(), `legacy-framework-control-${label}-`));
    try {
      assert.equal(spawnSync("git", ["init", "-q"], { cwd: directory }).status, 0);
      await writeFile(resolve(directory, "payload.unknown"), payload);
      await assert.rejects(collectRepositoryTextFiles(directory), /unapproved binary file/i, label);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  }
});

test("scans text found at a nominally approved binary path", async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "legacy-framework-binary-path-text-"));
  const assetDirectory = resolve(directory, "plugins/brand-runtime/assets");
  try {
    assert.equal(spawnSync("git", ["init", "-q"], { cwd: directory }).status, 0);
    await mkdir(assetDirectory, { recursive: true });
    await writeFile(resolve(assetDirectory, "icon.png"), "Specsfy", "utf8");
    const files = await collectRepositoryTextFiles(directory);
    const asset = files.find(({ path }) => path === "plugins/brand-runtime/assets/icon.png");
    assert.equal(asset?.content, "Specsfy");
    assert.throws(() => assertNoUnexpectedLegacyText(asset.path, asset.content), /retired framework/i);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("accepts an approved binary only at its exact path and bytes", async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "legacy-framework-approved-binary-"));
  const assetDirectory = resolve(directory, "plugins/brand-runtime/assets");
  try {
    assert.equal(spawnSync("git", ["init", "-q"], { cwd: directory }).status, 0);
    await mkdir(assetDirectory, { recursive: true });
    await writeFile(resolve(assetDirectory, "icon.png"), await readFile(resolve(root, "plugins/brand-runtime/assets/icon.png")));
    const files = await collectRepositoryTextFiles(directory);
    assert.equal(files.some(({ path }) => path === "plugins/brand-runtime/assets/icon.png"), false);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects approved binary bytes outside their exact path", async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "legacy-framework-binary-wrong-path-"));
  try {
    assert.equal(spawnSync("git", ["init", "-q"], { cwd: directory }).status, 0);
    await writeFile(resolve(directory, "copy.png"), await readFile(resolve(root, "plugins/brand-runtime/assets/icon.png")));
    await assert.rejects(collectRepositoryTextFiles(directory), /unapproved binary file/i);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects a malformed PNG framing at an approved path", async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "legacy-framework-malformed-png-"));
  const assetDirectory = resolve(directory, "plugins/brand-runtime/assets");
  const malformed = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.from([0, 0, 0, 13]),
    Buffer.from("IHDR"),
    Buffer.alloc(17),
    Buffer.alloc(4),
    Buffer.from("IEND"),
    Buffer.alloc(4),
  ]);
  try {
    assert.equal(spawnSync("git", ["init", "-q"], { cwd: directory }).status, 0);
    await mkdir(assetDirectory, { recursive: true });
    await writeFile(resolve(assetDirectory, "icon.png"), malformed);
    await assert.rejects(collectRepositoryTextFiles(directory), /unapproved binary file/i);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects unexpected ignored files from the repository inventory", async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "legacy-framework-ignored-file-"));
  try {
    assert.equal(spawnSync("git", ["init", "-q"], { cwd: directory }).status, 0);
    await writeFile(resolve(directory, ".gitignore"), "legacy.txt\n", "utf8");
    await writeFile(resolve(directory, "legacy.txt"), "Specsfy", "utf8");
    assert.throws(() => listRepositoryFiles(directory), /unapproved ignored critical-path entry/i);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("does not approve ignored files that only end with the DS Store name", async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "legacy-framework-ds-store-suffix-"));
  try {
    assert.equal(spawnSync("git", ["init", "-q"], { cwd: directory }).status, 0);
    await writeFile(resolve(directory, ".gitignore"), "*.DS_Store\n", "utf8");
    await writeFile(resolve(directory, "legacy.DS_Store"), "Specsfy", "utf8");
    assert.throws(() => listRepositoryFiles(directory), /unapproved ignored critical-path entry/i);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("permits only the exact ignored DS Store basename", async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "legacy-framework-exact-ds-store-"));
  try {
    assert.equal(spawnSync("git", ["init", "-q"], { cwd: directory }).status, 0);
    await writeFile(resolve(directory, ".gitignore"), ".DS_Store\n", "utf8");
    await writeFile(resolve(directory, ".DS_Store"), Buffer.from([0, 1, 2, 3]));
    const files = listRepositoryFiles(directory);
    assert.equal(files.includes(".DS_Store"), false);
    assert.equal(files.includes(".gitignore"), true);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("scans the guard itself with a bounded self-test literal budget", async () => {
  const files = await collectRepositoryTextFiles(root);
  const guard = files.find(({ path }) => path === guardPath);
  assert.ok(guard, "the guard must be included in its own repository snapshot");
  assert.doesNotThrow(() => assertNoUnexpectedLegacyText(guard.path, guard.content));
  assert.throws(
    () => assertNoUnexpectedLegacyText(guard.path, `${guard.content}\n${["Spec", "sfy"].join("")}`),
    /self-test literal budget/i,
  );
  const authorizedLine = guard.content.split("\n").find((line) => retiredFrameworkPattern.test(line));
  assert.throws(
    () => assertNoUnexpectedLegacyText(guard.path, guard.content.replace(authorizedLine, `${authorizedLine} changed`)),
    /self-test literal budget/i,
  );
});

async function exists(path) {
  try {
    await lstat(resolve(root, path));
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

test("fails closed when forbidden-path inspection returns an unexpected error", async () => {
  await assert.rejects(exists("\0"), { code: "ERR_INVALID_ARG_VALUE" });
});

test("treats a dangling symlink as an existing forbidden path", async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "legacy-framework-guard-"));
  const entry = resolve(directory, "forbidden");
  try {
    await symlink(resolve(directory, "missing"), entry);
    assert.equal(await exists(entry), true);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects a directory symlink before scanning its target", async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "legacy-framework-scan-"));
  const source = resolve(directory, "source");
  const scanned = resolve(directory, "scanned");
  try {
    await mkdir(source);
    await mkdir(scanned);
    await writeFile(resolve(source, "legacy.md"), "Specsfy", "utf8");
    await symlink(source, resolve(scanned, "linked"), "dir");

    await assert.rejects(assertSupportedTree(scanned), /symbolic link/i);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects a symlink used as the scan root", async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "legacy-framework-root-scan-"));
  const source = resolve(directory, "source");
  const scanned = resolve(directory, "scanned");
  try {
    await mkdir(source);
    await writeFile(resolve(source, "legacy.md"), "Specsfy", "utf8");
    await symlink(source, scanned, "dir");

    await assert.rejects(assertSupportedTree(scanned), /symbolic link/i);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects a file symlink used as a scanned entry", async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "legacy-framework-file-scan-"));
  const source = resolve(directory, "source.md");
  const scanned = resolve(directory, "scanned.md");
  try {
    await writeFile(source, "Specsfy", "utf8");
    await symlink(source, scanned, "file");

    await assert.rejects(openRepositoryFile(directory, "scanned.md"), /symbolic link/i);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("keeps repository content bound during a late file symlink swap", async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "legacy-framework-late-file-symlink-"));
  const scanned = resolve(directory, "scanned.md");
  const replacement = resolve(directory, "replacement.md");
  try {
    assert.equal(spawnSync("git", ["init", "-q"], { cwd: directory }).status, 0);
    await writeFile(scanned, "clean", "utf8");
    await writeFile(replacement, "Specsfy", "utf8");

    const files = await collectRepositoryTextFiles(directory, async () => {
      await rm(scanned);
      await symlink(replacement, scanned, "file");
    });

    assert.equal(files.find(({ path }) => path === "scanned.md")?.content, "clean");
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("keeps repository content bound during a late directory symlink swap", async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "legacy-framework-directory-swap-"));
  const scanned = resolve(directory, "scanned");
  const moved = resolve(directory, "moved");
  const replacement = resolve(directory, "replacement");
  try {
    assert.equal(spawnSync("git", ["init", "-q"], { cwd: directory }).status, 0);
    await mkdir(scanned);
    await mkdir(replacement);
    await writeFile(resolve(scanned, "legacy.md"), "Specsfy", "utf8");
    await writeFile(resolve(replacement, "clean.md"), "clean", "utf8");

    const files = await collectRepositoryTextFiles(directory, async () => {
      await rename(scanned, moved);
      await symlink(replacement, scanned, "dir");
    });

    assert.equal(files.find(({ path }) => path === "scanned/legacy.md")?.content, "Specsfy");
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects a special file nested in a scanned tree", { skip: process.platform === "win32" }, async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "legacy-framework-special-file-"));
  const socket = resolve(directory, "special.md");
  const server = createServer();
  try {
    await new Promise((resolveListen, rejectListen) => {
      server.once("error", rejectListen);
      server.listen(socket, resolveListen);
    });

    await assert.rejects(assertSupportedTree(directory), /unsupported critical-path entry type/i);
  } finally {
    await new Promise((resolveClose) => server.close(resolveClose));
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects a FIFO nested in the repository tree", { skip: process.platform === "win32" }, async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "legacy-framework-fifo-"));
  const fifo = resolve(directory, "legacy.txt");
  try {
    assert.equal(spawnSync("mkfifo", [fifo]).status, 0);
    await assert.rejects(assertSupportedTree(directory), /unsupported critical-path entry type/i);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

async function assertSupportedTree(path) {
  const absolute = resolve(root, path);
  let directory;
  try {
    directory = await opendir(absolute);
  } catch (error) {
    if (error?.code !== "ENOTDIR") throw error;
    const metadata = await lstat(absolute);
    if (metadata.isSymbolicLink()) throw new Error(`Refusing symbolic link in critical path: ${path}`);
    if (metadata.isFile()) return;
    throw new Error(`Unsupported critical-path entry type: ${path}`);
  }

  const current = await lstat(absolute);
  if (current.isSymbolicLink()) {
    await directory.close();
    throw new Error(`Refusing symbolic link in critical path: ${path}`);
  }
  if (!current.isDirectory()) {
    await directory.close();
    throw new Error(`Unsupported critical-path entry type: ${path}`);
  }

  for await (const entry of directory) {
    if (path === root && [".git", "node_modules"].includes(entry.name)) continue;
    const child = resolve(absolute, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Refusing symbolic link in critical path: ${child}`);
    if (entry.isDirectory()) await assertSupportedTree(child);
    else if (!entry.isFile()) throw new Error(`Unsupported critical-path entry type: ${child}`);
  }
}

function listRepositoryFiles(repositoryRoot) {
  const inventory = spawnSync("git", [
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
    "-z",
  ], {
    cwd: repositoryRoot,
    encoding: "buffer",
  });
  if (inventory.status !== 0) {
    throw new Error(`Unable to inventory repository critical path: ${inventory.stderr.toString("utf8").trim()}`);
  }

  const ignored = spawnSync("git", [
    "ls-files",
    "--others",
    "--ignored",
    "--exclude-standard",
    "-z",
  ], {
    cwd: repositoryRoot,
    encoding: "buffer",
  });
  if (ignored.status !== 0) {
    throw new Error(`Unable to inventory ignored repository paths: ${ignored.stderr.toString("utf8").trim()}`);
  }
  const unexpectedIgnored = ignored.stdout
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .filter((path) => !(
      path.split("/").at(-1) === ".DS_Store"
      || path === "node_modules"
      || path.startsWith("node_modules/")
      || path.includes("/node_modules/")
    ));
  if (unexpectedIgnored.length) {
    throw new Error(`Unapproved ignored critical-path entry: ${unexpectedIgnored.sort().join(", ")}`);
  }

  const deleted = spawnSync("git", ["ls-files", "--deleted", "-z"], {
    cwd: repositoryRoot,
    encoding: "buffer",
  });
  if (deleted.status !== 0) {
    throw new Error(`Unable to inventory deleted repository paths: ${deleted.stderr.toString("utf8").trim()}`);
  }
  const deletedPaths = new Set(deleted.stdout.toString("utf8").split("\0").filter(Boolean));

  return inventory.stdout
    .toString("utf8")
    .split("\0")
    .filter((path) => path && !deletedPaths.has(path))
    .sort();
}

async function openRepositoryFile(repositoryRoot, path) {
  const canonicalRoot = await realpath(repositoryRoot);
  const absolute = resolve(canonicalRoot, path);
  const containment = relative(canonicalRoot, absolute);
  if (containment === ".." || containment.startsWith(`..${sep}`) || isAbsolute(containment)) {
    throw new Error(`Critical-path entry escapes repository root: ${path}`);
  }

  const flags = constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0);
  let handle;
  try {
    handle = await open(absolute, flags);
  } catch (error) {
    if (error?.code === "ELOOP") throw new Error(`Refusing symbolic link in critical path: ${path}`);
    throw error;
  }

  try {
    const opened = await handle.stat();
    if (!opened.isFile()) throw new Error(`Unsupported critical-path entry type: ${path}`);

    const current = await lstat(absolute);
    if (current.isSymbolicLink()) throw new Error(`Refusing symbolic link in critical path: ${path}`);
    if (current.dev !== opened.dev || current.ino !== opened.ino) {
      throw new Error(`Critical-path entry changed while opening: ${path}`);
    }

    const canonical = await realpath(absolute);
    if (canonical !== absolute) throw new Error(`Refusing indirect critical-path entry: ${path}`);
    const canonicalMetadata = await lstat(canonical);
    if (canonicalMetadata.dev !== opened.dev || canonicalMetadata.ino !== opened.ino) {
      throw new Error(`Critical-path canonical target changed while opening: ${path}`);
    }
    return handle;
  } catch (error) {
    await handle.close();
    throw error;
  }
}

function isApprovedBinary(path, bytes) {
  const expected = approvedBinaryFiles.get(path);
  if (!expected) return false;
  return createHash("sha256").update(bytes).digest("hex") === expected;
}

function hasBinaryTextControls(content) {
  return /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/u.test(content);
}

async function collectRepositoryTextFiles(repositoryRoot, beforeRead = async () => {}) {
  const paths = listRepositoryFiles(repositoryRoot);
  const opened = [];
  try {
    for (const path of paths) {
      opened.push({ path, handle: await openRepositoryFile(repositoryRoot, path) });
    }
    await beforeRead();

    const files = [];
    const decoder = new TextDecoder("utf-8", { fatal: true });
    for (const { path, handle } of opened) {
      const bytes = await handle.readFile();
      let content;
      try {
        content = decoder.decode(bytes);
      } catch {
        if (isApprovedBinary(path, bytes)) continue;
        throw new Error(`Unapproved binary file in critical path: ${path}`);
      }
      if (hasBinaryTextControls(content)) {
        if (isApprovedBinary(path, bytes)) continue;
        throw new Error(`Unapproved binary file in critical path: ${path}`);
      }
      files.push({ path, content });
    }
    return files;
  } finally {
    await Promise.allSettled(opened.map(({ handle }) => handle.close()));
  }
}

// Migration guard: the repository must not reintroduce the retired framework.
test("keeps Specsfy outside the Brand Runtime critical path", async () => {
  for (const path of forbiddenPaths) {
    assert.equal(await exists(path), false, `${path} must not exist`);
  }

  await assertSupportedTree(root);
  const files = await collectRepositoryTextFiles(root);
  const packageEntry = files.find(({ path }) => path === "package.json");
  assert.ok(packageEntry, "package.json must be included in the repository snapshot");
  const packageJson = JSON.parse(packageEntry.content);
  assert.equal(packageJson.dependencies?.["@promovaweb/specsfy"], undefined);
  assert.equal(packageJson.devDependencies?.["@promovaweb/specsfy"], undefined);
  assert.deepEqual(
    Object.keys(packageJson.scripts ?? {}).filter((name) => name.toLowerCase().includes("specsfy")),
    [],
  );

  for (const { path, content } of files) {
    assertNoUnexpectedLegacyText(path, content);
  }
});
