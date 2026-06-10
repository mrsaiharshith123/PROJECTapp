#!/usr/bin/env node
/**
 * Engines must return { id, tone } — not hardcoded { text: "..." } for UI insights.
 *   npm run audit:insights:i18n
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ENGINES = path.join(ROOT, "src/engines");
const JSON_OUT = process.argv.includes("--json");

const ALLOW_FILES = new Set([
  "engines/pressureAdvanced.js", // severityLabel internal
  "engines/quickScenarios.js", // scenario row labels for catalog (translated in UI layer)
]);

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

function main() {
  const hits = [];
  const re = /\btext\s*:\s*["'`][^"'`]{8,}/g;

  for (const file of walk(ENGINES)) {
    const r = rel(file);
    if (ALLOW_FILES.has(r)) continue;
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (/\btext\s*:\s*["'`]/.test(line) && /insight|push\(|return \{/.test(line)) {
        hits.push({ file: r, line: i + 1, snippet: line.trim().slice(0, 100) });
      }
      if (re.test(line) && /insights\.push|narrativeLines\.push/.test(line)) {
        hits.push({ file: r, line: i + 1, snippet: line.trim().slice(0, 100) });
      }
    });
  }

  if (JSON_OUT) {
    console.log(JSON.stringify({ total: hits.length, items: hits }));
    process.exit(hits.length ? 1 : 0);
  }

  if (!hits.length) {
    console.log("Insight i18n: no hardcoded engine insight text found.");
    process.exit(0);
  }

  console.log(`Insight i18n — ${hits.length} hardcoded text field(s) in engines:\n`);
  hits.slice(0, 30).forEach((h) => console.log(`  ${h.file}:${h.line} — ${h.snippet}`));
  process.exit(1);
}

main();
