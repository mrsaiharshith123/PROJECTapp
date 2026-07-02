/**
 * Refactoring opportunities — duplicate functions, merge candidates.
 * Role: Refactoring Specialist
 */
import fs from "fs";
import path from "path";
import { SRC, rel, walk } from "../lib/audit-core.mjs";

const TRACK_FUNCTIONS = [
  "daysUntil", "formatAmount", "formatInr", "wealthCategoryLabel",
  "translateRepeatType", "getEffectiveStatus", "todayYmd",
  "combinedMonthlyIncome", "resolveUserMode", "tierHasFeature",
];

const ENGINE_OVERLAP_PAIRS = [
  ["forecast.js", "forecastSeries.js"],
  ["goalBalance.js", "goalsProgress.js"],
  ["pressureScore.js", "pressureAdvanced.js"],
  ["financialHealth.js", "perovoScore.js"],
  ["stabilityNarrative.js", "stabilityPlan.js"],
  ["lendingRecovery.js", "lendingTrust.js"],
];

export function runRefactoringAudit() {
  const errors = [], warnings = [], advisories = [];
  const enginesDir = path.join(SRC, "engines");

  // Duplicate function definitions across UI files
  const fnLocations = {};
  for (const fn of TRACK_FUNCTIONS) fnLocations[fn] = [];

  for (const file of walk(SRC, [], /\.(jsx|js)$/)) {
    const r = rel(file);
    if (r.includes("__tests__") || r.includes("governance")) continue;
    const code = fs.readFileSync(file, "utf8");
    for (const fn of TRACK_FUNCTIONS) {
      // Local function definition (not just import)
      if (new RegExp(`function ${fn}\\s*\\(|const ${fn}\\s*=`).test(code)) {
        fnLocations[fn].push(r);
      }
    }
  }

  for (const [fn, locs] of Object.entries(fnLocations)) {
    if (locs.length > 1) {
      warnings.push({ kind: "duplicate-function", message: `"${fn}" defined in ${locs.length} files — centralise in utils/`,
        detail: locs.join(", ") });
    }
  }

  // Engine overlap pairs
  for (const [a, b] of ENGINE_OVERLAP_PAIRS) {
    const fa = path.join(enginesDir, a);
    const fb = path.join(enginesDir, b);
    if (fs.existsSync(fa) && fs.existsSync(fb)) {
      const la = fs.readFileSync(fa, "utf8").split("\n").length;
      const lb = fs.readFileSync(fb, "utf8").split("\n").length;
      advisories.push({ kind: "engine-overlap",
        message: `${a} (${la}L) and ${b} (${lb}L) have overlapping purpose — merge to reduce confusion`,
        detail: `Combined: ${la + lb} lines → single file with clear function names` });
    }
  }

  // Tiny wrapper components (< 30 lines, just renders another component)
  let wrapperCount = 0;
  for (const file of walk(path.join(SRC, "ui"), [], /\.jsx$/)) {
    const code = fs.readFileSync(file, "utf8");
    const lines = code.split("\n").filter(l => l.trim()).length;
    if (lines < 30 && lines > 5 && /return\s*\(<[A-Z]/.test(code) &&
        (code.match(/import/g) || []).length <= 3) {
      wrapperCount++;
      advisories.push({ kind: "thin-wrapper", file: rel(file),
        message: `${lines}-line component appears to be a thin wrapper — merge into parent or delete` });
    }
  }

  // Large files that exceed best-practice size
  for (const file of walk(SRC, [], /\.(jsx|js)$/)) {
    const r = rel(file);
    if (/i18n\/messages/.test(r) || r.includes("__tests__")) continue;
    const lines = fs.readFileSync(file, "utf8").split("\n").length;
    if (lines >= 800) {
      errors.push({ kind: "giant-file", file: r,
        message: `${lines} lines — split by concern. Target: <350 lines per file.`,
        detail: "Large files slow code review, make merge conflicts more likely, and indicate missing abstraction." });
    }
  }

  // Estimate total removable files
  const removableCount = ENGINE_OVERLAP_PAIRS.filter(([a, b]) =>
    fs.existsSync(path.join(enginesDir, a)) && fs.existsSync(path.join(enginesDir, b))
  ).length + wrapperCount;

  advisories.push({ kind: "removable-estimate",
    message: `Estimated ${removableCount} files removable via merges without losing functionality` });

  return { id: "refactoring", title: "Refactoring opportunities & duplicate code", errors, warnings, advisories };
}
