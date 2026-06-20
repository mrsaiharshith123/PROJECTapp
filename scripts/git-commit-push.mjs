#!/usr/bin/env node
/** @deprecated Use `npm run ship` — forwards with --no-apk for commit/push only. */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const message = process.argv.slice(2).join(" ").trim();
if (!message) {
  console.error('Use: npm run ship -- "commit message"');
  process.exit(1);
}

const r = spawnSync(process.execPath, [path.join(ROOT, "scripts", "git-ship.mjs"), "--no-apk", message], {
  stdio: "inherit",
  cwd: ROOT,
});
process.exit(r.status ?? 1);
