#!/usr/bin/env node
/**
 * Roger all — full project health pass (run when user says "roger all").
 *
 *   npm run roger:all              # strict by default
 *   npm run roger:all -- --fix     # ESLint auto-fix before audit
 *   npm run roger:all -- --relaxed # advisories do not fail the gate
 */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const FIX = args.includes("--fix");
const RELAXED = args.includes("--relaxed");
const STRICT = !RELAXED;

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  dim: "\x1b[2m",
};

function run(label, script, scriptArgs = []) {
  console.log(`\n${C.cyan}${C.bold}▶ ${label}${C.reset}`);
  const r = spawnSync("npm", ["run", script, ...scriptArgs], {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
  });
  return r.status === 0;
}

console.log(`${C.bold}${C.cyan}
╔══════════════════════════════════════════════════════════╗
║  ROGER ALL — Perovo full maintenance pass                ║
╚══════════════════════════════════════════════════════════╝${C.reset}`);
console.log(`${C.dim}Mode: ${FIX ? "fix + audit" : "audit only"} · ${STRICT ? "strict" : "default"}${C.reset}\n`);

const steps = [];

if (FIX) {
  steps.push(["Lint auto-fix", "lint:fix", []]);
}

steps.push(
  ["Sync i18n keys from en.js", "sync:i18n", []],
  ["Docs vs code (implementation status)", "audit:docs-sync", []],
  ["Full production audit gate", RELAXED ? "audit:relaxed" : "audit", []],
);

let failed = 0;
for (const [label, script, scriptArgs] of steps) {
  const ok = run(label, script, scriptArgs);
  if (!ok) failed += 1;
}

console.log(`\n${C.bold}────────────────────────────────────────${C.reset}`);
if (failed === 0) {
  console.log(`${C.green}${C.bold}✓ ROGER ALL PASSED${C.reset}`);
  console.log(`${C.dim}Next: review any YELLOW advisories in the audit report above.${C.reset}\n`);
  process.exit(0);
}

console.log(`${C.red}${C.bold}✗ ROGER ALL FAILED — ${failed} step(s) need fixes${C.reset}`);
console.log(`${C.dim}Fix blocking errors, then run: npm run roger:all${C.reset}\n`);
process.exit(1);
