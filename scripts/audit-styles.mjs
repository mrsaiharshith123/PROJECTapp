#!/usr/bin/env node
/**
 * CSS / style compatibility audit (Safari prefixes, property order, undefined tokens).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const JSON_OUT = process.argv.includes("--json");

const errors = [];
const warnings = [];

function walkCss(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "_archive") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkCss(p, acc);
    else if (e.name.endsWith(".css")) acc.push(p);
  }
  return acc;
}

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function auditFile(file, definedGlobal) {
  const r = rel(file);
  const lines = fs.readFileSync(file, "utf8").split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ln = i + 1;

    if (/^\s*backdrop-filter\s*:/.test(line)) {
      const prev = lines[i - 1] || "";
      if (!/-webkit-backdrop-filter\s*:/.test(prev)) {
        errors.push({
          file: r,
          line: ln,
          rule: "css-compat",
          message: "backdrop-filter needs -webkit-backdrop-filter above it (Safari/iOS)",
        });
      } else if (/-webkit-backdrop-filter\s*:/.test(prev) && prev.trim().startsWith("backdrop-filter")) {
        warnings.push({
          file: r,
          line: ln,
          rule: "css-order",
          message: "-webkit-backdrop-filter must come before backdrop-filter",
        });
      }
    }

    if (/^\s*user-select\s*:/.test(line) && !/-webkit-user-select\s*:/.test(lines[i - 1] || "")) {
      warnings.push({
        file: r,
        line: ln,
        rule: "css-compat",
        message: "user-select may need -webkit-user-select for older WebKit",
      });
    }

    if (/^\s*mask\s*:/.test(line) && !/-webkit-mask\s*:/.test(lines[i - 1] || "")) {
      warnings.push({
        file: r,
        line: ln,
        rule: "css-compat",
        message: "mask may need -webkit-mask for Safari",
      });
    }
  }

  const undefinedVars = [...fs.readFileSync(file, "utf8").matchAll(/var\((--[a-zA-Z0-9-]+)\)/g)].map((m) => m[1]);
  const defined = new Set(definedGlobal);
  for (const m of fs.readFileSync(file, "utf8").matchAll(/^(\s*)?(--[a-zA-Z0-9-]+)\s*:/gm)) {
    defined.add(m[2]);
  }
  for (const v of undefinedVars) {
    if (!defined.has(v) && !v.startsWith("--tw-")) {
      warnings.push({
        file: r,
        line: 0,
        rule: "css-token",
        message: `CSS variable ${v} used but not defined in tokens.css or this file`,
      });
    }
  }
}

const cssFiles = [
  ...walkCss(path.join(ROOT, "src/ui/styles")),
  ...walkCss(path.join(ROOT, "src")).filter((f) => !f.includes("ui/styles") && rel(f) !== "src/index.css"),
];
const uniqueCss = [...new Set(cssFiles)];

/** Collect --var definitions across the whole style tree (cross-file var() is valid). */
const globalDefined = new Set();
for (const f of uniqueCss) {
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(/^(\s*)?(--[a-zA-Z0-9-]+)\s*:/gm)) globalDefined.add(m[2]);
}

for (const f of uniqueCss) auditFile(f, globalDefined);

const report = {
  errors: errors.length,
  warnings: warnings.length,
  errorItems: errors,
  warningItems: warnings,
};

if (JSON_OUT) {
  console.log(JSON.stringify(report));
  process.exit(errors.length ? 1 : 0);
}

console.log(`Style audit: ${errors.length} error(s), ${warnings.length} warning(s)\n`);
for (const e of errors.slice(0, 30)) {
  console.log(`  ${e.file}:${e.line} — ${e.message}`);
}
for (const w of warnings.slice(0, 15)) {
  console.log(`  [warn] ${w.file}:${w.line} — ${w.message}`);
}
process.exit(errors.length ? 1 : 0);
