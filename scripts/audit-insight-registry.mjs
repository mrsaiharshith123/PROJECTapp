#!/usr/bin/env node
/**
 * Every insight.{id} referenced in engines must exist in en.js.
 *   npm run audit:insight-registry
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ENGINES = path.join(ROOT, "src/engines");
const EN = path.join(ROOT, "src/i18n/messages/en.js");
const JSON_OUT = process.argv.includes("--json");

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "__tests__") continue;
      walk(p, acc);
    } else if (e.name.endsWith(".js") && !e.name.endsWith(".test.js")) acc.push(p);
  }
  return acc;
}

function main() {
  const enText = fs.readFileSync(EN, "utf8");
  const enKeys = new Set([...enText.matchAll(/"insight\.([^"]+)"/g)].map((m) => m[1]));

  const ids = new Set();
  const idRe = /\bid\s*:\s*["'`]([a-z0-9][a-z0-9-]*)["'`]/gi;
  const insightIdRe = /insightId\s*:\s*["'`]([a-z0-9][a-z0-9-]*)["'`]/gi;

  for (const file of walk(ENGINES)) {
    const text = fs.readFileSync(file, "utf8");
    let m;
    while ((m = idRe.exec(text))) {
      if (/push\(|insights|insight|tone/.test(text.slice(Math.max(0, m.index - 80), m.index + 80))) {
        ids.add(m[1]);
      }
    }
    while ((m = insightIdRe.exec(text))) ids.add(m[1]);
  }

  const missing = [...ids].filter((id) => !enKeys.has(id));

  if (JSON_OUT) {
    console.log(JSON.stringify({ total: missing.length, items: missing }));
    process.exit(missing.length ? 1 : 0);
  }

  if (!missing.length) {
    console.log(`Insight registry: ${ids.size} engine insight id(s), all in en.js.`);
    process.exit(0);
  }

  console.log(`Insight registry — ${missing.length} missing en.js key(s):\n`);
  missing.slice(0, 40).forEach((id) => console.log(`  • insight.${id}`));
  process.exit(1);
}

main();
