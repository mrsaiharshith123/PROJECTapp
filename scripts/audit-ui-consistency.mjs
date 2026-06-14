#!/usr/bin/env node
/**
 * UI consistency scan — non-blocking warnings for src/ui/features pages.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const FEATURES = path.join(ROOT, "src/ui/features");
const PAGES_DIR = path.join(FEATURES, "pages");

const violations = [];

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith(".jsx") || e.name.endsWith(".tsx")) acc.push(p);
  }
  return acc;
}

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function scanJsx(file) {
  const r = rel(file);
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ln = i + 1;

    if (/#[0-9a-fA-F]{3,8}\b/.test(line) && !line.trim().startsWith("//")) {
      violations.push({ file: r, line: ln, rule: "hex-color", message: "Hardcoded hex color in JSX — use ct-* classes or CSS tokens" });
    }

    if (/borderRadius\s*:\s*['"]?\d+px/.test(line) || /rounded-\[\d+px\]/.test(line)) {
      if (!/--ct-radius/.test(line)) {
        violations.push({ file: r, line: ln, rule: "border-radius", message: "Hardcoded border-radius — use --ct-radius-* tokens" });
      }
    }

    if (/fontSize\s*:\s*['"]?\d/.test(line) && /(?:amount|score|metric|numeral|₹|formatInr)/i.test(line)) {
      violations.push({ file: r, line: ln, rule: "financial-font", message: "Inline font-size on financial number — use ct-numeral or ct-hero-metric" });
    }
  }
}

function scanPages() {
  if (!fs.existsSync(PAGES_DIR)) return;
  for (const e of fs.readdirSync(PAGES_DIR, { withFileTypes: true })) {
    if (!e.isFile() || !e.name.endsWith(".jsx")) continue;
    if (e.name === "HomePage.jsx") continue;
    const file = path.join(PAGES_DIR, e.name);
    const text = fs.readFileSync(file, "utf8");
    if (e.name === "AddPage.jsx" && /AddCommitmentForm/.test(text)) continue;
    if (!/PageShell/.test(text)) {
      violations.push({
        file: rel(file),
        line: 1,
        rule: "page-shell",
        message: "Page should use PageShell (HomePage exempt)",
      });
    }
  }
}

const jsxFiles = walk(FEATURES);
for (const f of jsxFiles) scanJsx(f);
scanPages();

console.log("audit:ui-consistency");
if (violations.length === 0) {
  console.log("✓ No violations found.");
  process.exit(0);
}

console.log(`⚠ ${violations.length} violation(s):\n`);
for (const v of violations) {
  console.log(`  ${v.file}:${v.line} [${v.rule}] ${v.message}`);
}
console.log("\n(non-blocking — exit 0)");
process.exit(0);
