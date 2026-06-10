#!/usr/bin/env node
/**
 * Report engine modules missing unit tests.
 *   npm run audit:engine-tests
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

function main() {
  const engines = walk(ENGINES);
  const untested = engines.filter((f) => !testPathFor(f)).map(rel);
  const tested = engines.length - untested.length;

  if (JSON_OUT) {
    console.log(
      JSON.stringify({
        total: engines.length,
        tested,
        untested: untested.length,
        items: untested,
      }),
    );
    process.exit(STRICT && untested.length ? 1 : 0);
  }

  console.log(`Engine tests: ${tested}/${engines.length} modules have tests`);
  if (!untested.length) {
    console.log("All engine modules have test files.");
    process.exit(0);
  }
  console.log(`\nMissing tests (${untested.length}):\n`);
  untested.forEach((f) => console.log(`  • ${f}`));
  process.exit(STRICT ? 1 : 0);
}

main();
