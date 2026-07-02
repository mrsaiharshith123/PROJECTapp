/**
 * Financial engine correctness audit.
 * Role: Business Logic Reviewer
 */
import fs from "fs";
import { SRC, rel, walk } from "../lib/audit-core.mjs";

export function runBusinessLogicAudit() {
  const errors = [], warnings = [], advisories = [];

  for (const file of walk(SRC, [], /\.js$/)) {
    const r = rel(file);
    const isEngine = r.startsWith("src/engines/") || r.startsWith("src/utils/");
    if (!isEngine || r.includes("__tests__")) continue;
    const code = fs.readFileSync(file, "utf8");

    // Division without zero guard on income
    if (/[/*]\s*(income|monthlyIncome|salary)\b/.test(code) &&
        !/income\s*>\s*0|income\s*\?|Math\.max\([\s\S]{0,30}income/.test(code)) {
      warnings.push({ kind: "division-no-guard", file: r,
        message: "Division/multiplication by income without zero guard → Infinity when income=0" });
    }

    // .toFixed() result used as number (returns string, breaks arithmetic)
    const tofixedAsNum = [...code.matchAll(/\.toFixed\(\d+\)\s*[+\-*\/]|[+\-*\/]\s*\w+\.toFixed/g)];
    if (tofixedAsNum.length > 0) {
      errors.push({ kind: "toFixed-as-number", file: r,
        message: `.toFixed() used in arithmetic — returns a string, causes NaN. Wrap with Number() or use Math.round()` });
    }

    // Number() without fallback (Number(undefined) = NaN, silently)
    const unsafeNumber = [...code.matchAll(/Number\s*\(\s*\w+(?:\.\w+)*\s*\)(?!\s*\|\|)/g)];
    if (unsafeNumber.length > 3) {
      advisories.push({ kind: "number-no-fallback", file: r,
        message: `${unsafeNumber.length} Number() calls without || 0 fallback — will produce NaN on undefined input` });
    }

    // Magic number tax rates (should be named constants)
    if (/0\.125|0\.30|0\.20|0\.12\.5/g.test(code) && r.includes("engines/")) {
      advisories.push({ kind: "magic-tax-rate", file: r,
        message: "Hardcoded tax rate (0.125 / 0.30 / 0.20) — use named constant e.g. LTCG_RATE = 0.125" });
    }

    // Inconsistent rounding (mix of Math.round and Math.floor on money)
    const hasRound = /Math\.round/.test(code);
    const hasFloor = /Math\.floor/.test(code);
    if (hasRound && hasFloor && r.includes("engines/")) {
      advisories.push({ kind: "rounding-inconsistency", file: r,
        message: "Mixes Math.round and Math.floor on financial values — standardise to Math.round for rupee amounts" });
    }

    // Circular value detection (value used to compute CAGR which is then compared to value)
    if (/estimatedCurrentValue|propertyEstimatedValue|valueAutoEstimated/.test(code) &&
        /cagr|CAGR|growthRate/.test(code)) {
      errors.push({ kind: "circular-valuation", file: r,
        message: "Possible circular calculation: estimated value used to compute CAGR that describes the same estimation rate" });
    }

    // Missing infinity / NaN guard before returning score
    if (/return\s+\{[\s\S]{0,200}score\s*:/.test(code) &&
        !/isFinite|isNaN|Number\.isFinite/.test(code)) {
      advisories.push({ kind: "score-no-nan-guard", file: r,
        message: "Engine returns a score object without NaN/Infinity guard — add isFinite() check before returning" });
    }
  }

  return { id: "business-logic", title: "Business logic & financial engine correctness", errors, warnings, advisories };
}
