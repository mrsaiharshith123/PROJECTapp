#!/usr/bin/env node
/**
 * Classify engine depth by line count + export count.
 * Flags skeleton modules (<40 lines, ≤2 exports) for deepening.
 *   npm run audit:complexity
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

function countLines(text) {
  return text
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("//") && !l.trim().startsWith("*"))
    .length;
}

function countExports(text) {
  const matches = text.match(/^export\s+(function|const|class|async function)/gm);
  return matches ? matches.length : 0;
}

function depthBand(lines) {
  if (lines >= 200) return "advanced";
  if (lines >= 70) return "solid";
  if (lines >= 40) return "moderate";
  return "basic";
}

function main() {
  const engines = walk(ENGINES);
  /** @type {{ file: string, lines: number, exports: number, band: string, skeleton: boolean }[]} */
  const rows = engines.map((f) => {
    const text = fs.readFileSync(f, "utf8");
    const lines = countLines(text);
    const exports = countExports(text);
    const band = depthBand(lines);
    const skeleton = lines < 40 && exports <= 2;
    return { file: rel(f), lines, exports, band, skeleton };
  });

  const skeletons = rows.filter((r) => r.skeleton);
  const basic = rows.filter((r) => r.band === "basic" && !r.skeleton);

  if (JSON_OUT) {
    console.log(JSON.stringify({ total: rows.length, skeletons: skeletons.length, basic: basic.length, items: rows }));
    process.exit(STRICT && skeletons.length ? 1 : 0);
  }

  const bands = { advanced: 0, solid: 0, moderate: 0, basic: 0 };
  rows.forEach((r) => {
    bands[r.band]++;
  });

  console.log(`Engine complexity: ${bands.advanced} advanced · ${bands.solid} solid · ${bands.moderate} moderate · ${bands.basic} basic`);
  if (skeletons.length) {
    console.log(`\nSkeleton engines to deepen (${skeletons.length}):\n`);
    skeletons
      .sort((a, b) => a.lines - b.lines)
      .forEach((r) => console.log(`  • ${r.file} — ${r.lines}L, ${r.exports} export(s)`));
  }
  process.exit(STRICT && skeletons.length ? 1 : 0);
}

main();
