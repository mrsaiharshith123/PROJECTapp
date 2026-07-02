#!/usr/bin/env node
/** Adds type="button" to <button> elements missing type=. */
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const SRC = join(ROOT, "src");

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const full = join(dir, f);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (f.endsWith(".jsx") || f.endsWith(".js")) out.push(full);
  }
  return out;
}

let fixed = 0;
let files = 0;

for (const file of walk(SRC)) {
  const before = readFileSync(file, "utf8");
  const after = before.replace(
    /<button(?=[^>]*>)(?![^>]*\btype\s*=)(\s)/g,
    '<button type="button"$1',
  );
  if (after !== before) {
    writeFileSync(file, after);
    files++;
    fixed += (before.match(/<button(?=[^>]*>)(?![^>]*\btype\s*=)(\s)/g) || []).length;
    console.log(`  fixed ${file.replace(ROOT + "/", "")}`);
  }
}
console.log(`\n✓ Added type="button" to ${fixed} buttons across ${files} files`);
