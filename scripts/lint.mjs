import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const roots = process.argv.slice(2);
const defaultRoots = [
  "apps/web/features",
  "packages/config/src",
  "packages/domain/src",
  "packages/domain/test",
  "scripts"
];

const ignoredDirectories = new Set([
  ".git",
  ".next",
  "dist",
  "node_modules",
  "src/generated"
]);

const targetRoots = roots.length > 0 ? roots : defaultRoots;
const files = targetRoots.flatMap((root) => collectFiles(root));

if (files.length === 0) {
  console.log("No lintable JavaScript modules found.");
  process.exit(0);
}

const failures = [];

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8"
  });

  if (result.status !== 0) {
    failures.push({
      file,
      output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim()
    });
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`Syntax check failed: ${failure.file}`);
    if (failure.output) {
      console.error(failure.output);
    }
  }

  process.exit(1);
}

console.log(`Syntax checked ${files.length} JavaScript modules.`);

function collectFiles(root) {
  let stats;

  try {
    stats = statSync(root);
  } catch {
    return [];
  }

  if (stats.isFile()) {
    return root.endsWith(".mjs") ? [root] : [];
  }

  if (!stats.isDirectory()) {
    return [];
  }

  const entries = readdirSync(root);
  const collected = [];

  for (const entry of entries) {
    const path = join(root, entry);
    const relativePath = relative(process.cwd(), path);

    if (isIgnored(relativePath)) {
      continue;
    }

    const entryStats = statSync(path);

    if (entryStats.isDirectory()) {
      collected.push(...collectFiles(path));
      continue;
    }

    if (entryStats.isFile() && path.endsWith(".mjs")) {
      collected.push(path);
    }
  }

  return collected;
}

function isIgnored(path) {
  return [...ignoredDirectories].some((ignored) => {
    return path === ignored || path.startsWith(`${ignored}/`);
  });
}
