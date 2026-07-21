import { copyFile, mkdir, readdir, readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = resolve(process.env.BRAND_SKILL_SOURCE || resolve(repositoryRoot, "../../../.ai/skills/brand"));
const targetRoot = resolve(repositoryRoot, "plugins/brand-runtime/skills/brand");
const included = ["SKILL.md", "checklists", "references", "rules", "scripts", "tasks"];
const mode = process.argv.includes("--check") ? "check" : process.argv.includes("--write") ? "write" : "";

if (!mode) throw new Error("Use --write to synchronize or --check to verify the publishable skill.");

async function listFiles(root, path = root) {
  const entries = await readdir(path, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = resolve(path, entry.name);
    if (entry.isDirectory()) return listFiles(root, entryPath);
    return entry.isFile() ? [relative(root, entryPath).replaceAll("\\", "/")] : [];
  }));
  return files.flat().sort();
}

async function expectedFiles() {
  const files = [];
  for (const path of included) {
    const source = resolve(sourceRoot, path);
    if (path.endsWith(".md")) files.push(path);
    else files.push(...(await listFiles(source)).map((file) => `${path}/${file}`));
  }
  return files.sort();
}

async function sameFile(left, right) {
  try {
    const [leftBody, rightBody] = await Promise.all([readFile(left), readFile(right)]);
    return leftBody.equals(rightBody);
  } catch {
    return false;
  }
}

async function main() {
  const expected = await expectedFiles();
  const mismatches = [];

  for (const file of expected) {
    const source = resolve(sourceRoot, file);
    const target = resolve(targetRoot, file);
    if (mode === "write") {
      await mkdir(dirname(target), { recursive: true });
      await copyFile(source, target);
    } else if (!(await sameFile(source, target))) {
      mismatches.push(file);
    }
  }

  if (mode === "check") {
    let actual = [];
    try {
      actual = await listFiles(targetRoot);
    } catch {
      // Missing target files are reported below.
    }
    for (const extra of actual.filter((file) => !expected.includes(file))) mismatches.push(`${extra} (unexpected)`);
    if (mismatches.length > 0) {
      throw new Error(`Publishable skill differs from the canonical Brand skill:\n- ${mismatches.join("\n- ")}`);
    }
    process.stdout.write(`Brand Runtime skill is synchronized (${expected.length} files).\n`);
    return;
  }

  process.stdout.write(`Synchronized ${expected.length} Brand skill files into Brand Runtime.\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
