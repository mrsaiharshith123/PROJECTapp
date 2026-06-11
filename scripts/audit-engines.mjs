#!/usr/bin/env node
/**
 * Engine purity + per-module test coverage.
 *   npm run audit:engines
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ENGINES = path.join(ROOT, "src/engines");
const JSON_OUT = process.argv.includes("--json");
const STRICT = process.argv.includes("--strict");

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "__tests__") continue;
      walk(p, acc);
    } else if (e.name.endsWith(".js") && !e.name.endsWith(".test.js")) {
      acc.push(p);
    }
  }
  return acc;
}

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

function testPathFor(engineFile) {
  const dir = path.dirname(engineFile);
  const base = path.basename(engineFile, ".js");
  const nested = path.join(dir, "__tests__", `${base}.test.js`);
  if (fs.existsSync(nested)) return nested;
  const sibling = path.join(dir, `${base}.test.js`);
  if (fs.existsSync(sibling)) return sibling;
  return null;
}

function scanViolations(file) {
  const text = fs.readFileSync(file, "utf8");
  const hits = [];
  if (/from\s+['"]react['"]/.test(text)) hits.push("imports React");
  if (/className\s*=\s*['"`]/.test(text)) hits.push("returns JSX/className");
  if (/from\s+['"][^'"]*\/ui\//.test(text)) hits.push("imports from ui/");
  return hits;
}

function main() {
  const engines = walk(ENGINES);
  const untested = engines.filter((f) => !testPathFor(f)).map(rel);
  const violations = [];
  for (const f of engines) {
    const v = scanViolations(f);
    if (v.length) violations.push({ file: rel(f), issues: v });
  }

  const errors = [...untested.map((f) => ({ type: "no-test", file: f })), ...violations.map((v) => ({ type: "violation", ...v }))];

  if (JSON_OUT) {
    console.log(
      JSON.stringify({
        total: engines.length,
        tested: engines.length - untested.length,
        untested: untested.length,
        violations: violations.length,
        items: errors,
      }),
    );
    process.exit(STRICT && errors.length ? 1 : 0);
  }

  console.log(`Engine audit: ${engines.length - untested.length}/${engines.length} modules have test files`);
  if (violations.length) {
    console.log(`\nPurity violations (${violations.length}):\n`);
    violations.forEach((v) => console.log(`  • ${v.file} — ${v.issues.join(", ")}`));
  }
  if (untested.length) {
    console.log(`\nMissing test files (${untested.length}):\n`);
    untested.forEach((f) => console.log(`  • ${f}`));
  }
  if (!errors.length) {
    console.log("All engine modules have tests and pass purity checks.");
    process.exit(0);
  }
  process.exit(STRICT ? 1 : 0);
}

main();
