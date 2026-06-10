#!/usr/bin/env node
/**
 * Every supabase.functions.invoke('name') should have a matching edge function folder.
 *   npm run audit:edge-functions
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const FUNCTIONS = path.join(ROOT, "supabase/functions");
const JSON_OUT = process.argv.includes("--json");

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === "dist") continue;
      walk(p, acc);
    } else if (/\.(js|jsx|ts|tsx)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

function main() {
  const invokes = new Set();
  const re = /functions\.invoke\s*\(\s*['"`]([^'"`]+)['"`]/g;

  for (const file of walk(SRC)) {
    const text = fs.readFileSync(file, "utf8");
    let m;
    while ((m = re.exec(text))) invokes.add(m[1]);
  }

  const hits = [];
  for (const name of invokes) {
    const folder = path.join(FUNCTIONS, name);
    if (!fs.existsSync(folder)) {
      hits.push({ name, note: `Missing supabase/functions/${name}/` });
    }
  }

  if (JSON_OUT) {
    console.log(JSON.stringify({ total: hits.length, items: hits, invoked: [...invokes] }));
    process.exit(hits.length ? 1 : 0);
  }

  if (!hits.length) {
    console.log(`Edge functions: ${invokes.size} invoke(s), all folders present.`);
    process.exit(0);
  }

  console.log(`Edge functions — ${hits.length} missing folder(s):\n`);
  hits.forEach((h) => console.log(`  • ${h.name} — ${h.note}`));
  process.exit(1);
}

main();
