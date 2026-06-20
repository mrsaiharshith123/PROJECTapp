/**
 * Replace user-facing "Perovo" with "Perovo" in src (keeps internal context/hook names).
 * Run: node scripts/rebrand-user-facing.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC = path.join(ROOT, "src");

const SKIP_LINE = [
  /usePerovo/,
  /PerovoContext/,
  /PerovoProvider/,
  /usePerovoCrud/,
  /PerovoContextValue/,
  /PerovoCrud/,
];

const FILES = [];

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    const st = fs.statSync(fp);
    if (st.isDirectory()) walk(fp);
    else if (/\.(js|jsx)$/.test(name)) FILES.push(fp);
  }
}

walk(SRC);

let changed = 0;
for (const fp of FILES) {
  if (fp.includes("PerovoContext.jsx") || fp.includes("usePerovoCrud.js")) continue;
  const lines = fs.readFileSync(fp, "utf8").split("\n");
  let touched = false;
  const next = lines.map((line) => {
    if (!line.includes("Perovo")) return line;
    if (SKIP_LINE.some((re) => re.test(line))) return line;
    touched = true;
    return line.replace(/Perovo/g, "Perovo");
  });
  if (touched) {
    fs.writeFileSync(fp, next.join("\n"));
    changed += 1;
    console.log(path.relative(ROOT, fp));
  }
}

// Export download prefixes
const backup = path.join(SRC, "ui/features/profile/ProfileBackupSection.jsx");
if (fs.existsSync(backup)) {
  let t = fs.readFileSync(backup, "utf8");
  const n = t.replace(/perovo-/g, "perovo-");
  if (n !== t) {
    fs.writeFileSync(backup, n);
    console.log("ProfileBackupSection download names");
  }
}

const agreement = path.join(SRC, "utils/agreementExport.js");
if (fs.existsSync(agreement)) {
  let t = fs.readFileSync(agreement, "utf8");
  const n = t.replace(/perovo-/g, "perovo-");
  if (n !== t) {
    fs.writeFileSync(agreement, n);
    console.log("agreementExport download names");
  }
}

console.log(`Updated ${changed} file(s).`);
