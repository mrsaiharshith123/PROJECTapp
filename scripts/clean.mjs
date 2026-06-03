#!/usr/bin/env node
/** Remove generated build folders (safe — not source). */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIRS = ["dist", "dev-dist", "dist-ssr"];

for (const name of DIRS) {
  const p = path.join(ROOT, name);
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
    console.log(`Removed ${name}/`);
  }
}
console.log("Clean done (dist, dev-dist, dist-ssr).");
