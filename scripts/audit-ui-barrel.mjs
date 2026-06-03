#!/usr/bin/env node
/**
 * Finds UI barrel exports (src/ui/index.js) never imported anywhere in src/.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const INDEX = path.join(ROOT, "src/ui/index.js");
const JSON_OUT = process.argv.includes("--json");

const indexSrc = fs.readFileSync(INDEX, "utf8");
const exportNames = [];

for (const m of indexSrc.matchAll(/export\s+\{\s*([^}]+)\s*\}\s+from/g)) {
  const chunk = m[1];
  for (const part of chunk.split(",")) {
    const named = part.match(/(?:\w+\s+as\s+)?(\w+)/);
    if (named) exportNames.push(named[1]);
  }
}
for (const m of indexSrc.matchAll(/export\s+\{\s*default\s+as\s+(\w+)\s*\}/g)) {
  exportNames.push(m[1]);
}

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === "__tests__") continue;
      walk(p, acc);
    } else if (/\.(jsx|js)$/.test(e.name) && p !== INDEX) {
      acc.push(p);
    }
  }
  return acc;
}

const srcFiles = walk(path.join(ROOT, "src"));
const unused = [];

for (const name of exportNames) {
  if (name === "cn") continue;
  const re = new RegExp(`\\b${name}\\b`);
  let used = false;
  for (const file of srcFiles) {
    const code = fs.readFileSync(file, "utf8");
    if (file.includes(`${path.sep}ui${path.sep}index.js`)) continue;
    if (re.test(code)) {
      used = true;
      break;
    }
  }
  if (!used) unused.push(name);
}

const PAGE_DIR = path.join(ROOT, "src/ui/features/pages");
const unmountedPages = [];
if (fs.existsSync(PAGE_DIR)) {
  const appSrc = fs.readFileSync(path.join(ROOT, "src/App.jsx"), "utf8");
  for (const file of fs.readdirSync(PAGE_DIR)) {
    if (!file.endsWith("Page.jsx")) continue;
    const base = file.replace(/Page\.jsx$/, "");
    const shell = path.join(ROOT, "src/pages", `${base}.jsx`);
    const inApp =
      appSrc.includes(`/${base.toLowerCase()}`) ||
      appSrc.includes(`/${base}`) ||
      fs.existsSync(shell);
    if (!inApp && !fs.existsSync(shell)) {
      unmountedPages.push(file);
    }
  }
}

const report = { unusedExports: unused.length, items: unused, unmountedPages: unmountedPages.length, pageItems: unmountedPages };

if (JSON_OUT) {
  console.log(JSON.stringify(report));
  process.exit(unused.length || unmountedPages.length ? 1 : 0);
}

if (unused.length) {
  console.log(`UI barrel: ${unused.length} export(s) never used in app:\n`);
  unused.forEach((n) => console.log(`  - ${n}`));
}
if (unmountedPages.length) {
  console.log(`\nPages built but not routed: ${unmountedPages.length}`);
  unmountedPages.forEach((f) => console.log(`  - ${f}`));
}
if (unused.length || unmountedPages.length) process.exit(1);
console.log("UI barrel: all exports referenced; all *Page.jsx routed");
process.exit(0);
