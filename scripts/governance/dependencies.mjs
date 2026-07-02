/**
 * Dependency & bundle health audit.
 * Role: Performance Engineer
 */
import fs from "fs";
import path from "path";
import { ROOT, SRC, rel, walk } from "../lib/audit-core.mjs";

const HEAVY_DEPS = {
  "tesseract.js":   { sizeMb: 4.0, note: "OCR library — must be dynamically imported, never in main bundle" },
  "pdfmake":        { sizeMb: 0.6, note: "PDF generation — dynamically import only when export triggered" },
  "pdfjs-dist":     { sizeMb: 0.8, note: "PDF parsing — dynamically import only when scan triggered" },
  "exceljs":        { sizeMb: 0.5, note: "Excel export — dynamically import only on export action" },
  "recharts":       { sizeMb: 0.35, note: "Chart library — lazy-load chart panels" },
  "@lottiefiles/react-lottie-player": { sizeMb: 0.04, note: "Lottie player — replace with CSS animation if < 3 uses" },
};

export function runDependenciesAudit() {
  const errors = [], warnings = [], advisories = [];
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const prodDeps = Object.keys(pkg.dependencies || {});
  const devDeps  = Object.keys(pkg.devDependencies || {});

  // Dev tools in production dependencies
  const shouldBeDevDeps = ["sharp", "archiver", "playwright", "@capacitor/assets"];
  for (const dep of shouldBeDevDeps) {
    if (prodDeps.includes(dep)) {
      warnings.push({ kind: "dev-dep-in-prod",
        message: `"${dep}" in dependencies — should be devDependencies (build/tool only, not runtime)` });
    }
  }

  // Heavy deps without dynamic import evidence
  for (const [dep, { sizeMb, note }] of Object.entries(HEAVY_DEPS)) {
    if (!prodDeps.includes(dep)) continue;
    let dynamicImportCount = 0;
    let staticImportCount  = 0;
    for (const file of walk(SRC, [], /\.(jsx|js)$/)) {
      const code = fs.readFileSync(file, "utf8");
      const depShort = dep.split("/")[0].split(".")[0]; // "tesseract" from "tesseract.js"
      if (/import\s*\(/.test(code) && new RegExp(depShort, "i").test(code)) dynamicImportCount++;
      if (/^import\s+/.test(code) && new RegExp(`from\\s+["']${dep}["']`).test(code)) staticImportCount++;
    }
    if (staticImportCount > 0 && dynamicImportCount === 0) {
      errors.push({ kind: "heavy-static-import", message: `"${dep}" (~${sizeMb}MB) has static imports — ${note}` });
    } else if (dynamicImportCount === 0 && staticImportCount === 0) {
      advisories.push({ kind: "dep-unused", message: `"${dep}" in dependencies but no imports found — remove if unused` });
    }
  }

  // Dual PDF libraries
  if (prodDeps.includes("pdfmake") && prodDeps.includes("pdfjs-dist")) {
    advisories.push({ kind: "dual-pdf-libs",
      message: "Both pdfmake (generation) and pdfjs-dist (parsing) in dependencies — both heavy, ensure both are dynamically imported" });
  }

  // Deps imported only once (trivial util)
  const depUsageCounts = {};
  for (const dep of prodDeps) {
    depUsageCounts[dep] = 0;
    const short = dep.replace(/@[^/]+\//, "");
    for (const file of walk(SRC, [], /\.(jsx|js)$/)) {
      const code = fs.readFileSync(file, "utf8");
      if (new RegExp(`from\\s+["']${dep}|require\\(["']${dep}`).test(code)) depUsageCounts[dep]++;
    }
  }
  for (const [dep, count] of Object.entries(depUsageCounts)) {
    if (count === 1 && !HEAVY_DEPS[dep] && dep !== "react" && dep !== "react-dom") {
      advisories.push({ kind: "single-use-dep",
        message: `"${dep}" used in only 1 file — consider inlining if the used portion is small` });
    }
  }

  return { id: "dependencies", title: "Bundle size & dependency health", errors, warnings, advisories };
}
