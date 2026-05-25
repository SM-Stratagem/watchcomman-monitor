import { cp, mkdir, stat } from "node:fs/promises";
import path from "node:path";

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function copyDir(src, dest) {
  await mkdir(dest, { recursive: true });
  await cp(src, dest, { recursive: true });
}

const root = process.cwd();
const nextDir = path.join(root, ".next");
const standaloneDir = path.join(nextDir, "standalone");

const staticSrc = path.join(nextDir, "static");
const staticDest = path.join(standaloneDir, ".next", "static");
const publicSrc = path.join(root, "public");
const publicDest = path.join(standaloneDir, "public");

if (!(await exists(standaloneDir))) {
  console.warn("[prepare-standalone] .next/standalone not found; skipping.");
  process.exit(0);
}

if (await exists(staticSrc)) {
  await copyDir(staticSrc, staticDest);
}

if (await exists(publicSrc)) {
  await copyDir(publicSrc, publicDest);
}

console.log("[prepare-standalone] Standalone assets prepared.");
