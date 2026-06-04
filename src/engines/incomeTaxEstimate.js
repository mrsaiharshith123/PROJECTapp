/**
 * Simplified India income-tax estimate for salaried users (education only — not filing advice).
 * FY 2025–26 style new regime slabs + Section 87A rebate cap.
 */

/** @type {[number, number][]} */
const NEW_REGIME_SLABS = [
  [400_000, 0],
  [800_000, 0.05],
  [1_200_000, 0.1],
  [1_600_000, 0.15],
  [2_000_000, 0.2],
  [2_400_000, 0.25],
  [Number.POSITIVE_INFINITY, 0.3],
];

/** @type {[number, number][]} */
const OLD_REGIME_SLABS = [
  [250_000, 0],
  [500_000, 0.05],
  [1_000_000, 0.2],
  [Number.POSITIVE_INFINITY, 0.3],
];

const STANDARD_DEDUCTION = { new: 75_000, old: 50_000 };
const MAX_80C = 150_000;
const REBATE_87A_NEW = { incomeCap: 1_200_000, maxRebate: 60_000 };
const HEALTH_EDU_CESS = 0.04;

/**
 * @param {number} taxableIncome
 * @param {[number, number][]} slabs
 */
export function computeMarginalTax(taxableIncome, slabs) {
  const amount = Math.max(0, taxableIncome);
  let tax = 0;
  let lower = 0;
  for (const [upper, rate] of slabs) {
    if (amount <= lower) break;
    const inSlab = Math.min(amount, upper) - lower;
    if (inSlab > 0) tax += inSlab * rate;
    lower = upper;
  }
  return Math.round(tax);
}

/**
 * @param {object} input
 * @param {number} input.annualGrossIncome
 * @param {"new"|"old"} [input.regime]
 * @param {number} [input.deduction80c]
 * @param {number} [input.deduction80d]
 * @param {number} [input.otherDeductions]
 */
export function estimateIncomeTax(input) {
  const gross = Math.max(0, Number(input.annualGrossIncome) || 0);
  const regime = input.regime === "old" ? "old" : "new";
  const std = STANDARD_DEDUCTION[regime];
  const c80 = Math.min(MAX_80C, Math.max(0, Number(input.deduction80c) || 0));
  const d80 = Math.max(0, Number(input.deduction80d) || 0);
  const other = Math.max(0, Number(input.otherDeductions) || 0);

  const chapterVia =
    regime === "old" ? c80 + d80 + other : 0;
  const taxable = Math.max(0, gross - std - chapterVia);
  const slabs = regime === "old" ? OLD_REGIME_SLABS : NEW_REGIME_SLABS;
  const taxBeforeRebate = computeMarginalTax(taxable, slabs);

  let rebate87a = 0;
  if (regime === "new" && gross <= REBATE_87A_NEW.incomeCap) {
    rebate87a = Math.min(taxBeforeRebate, REBATE_87A_NEW.maxRebate);
  } else if (regime === "old" && taxable <= 500_000) {
    rebate87a = Math.min(taxBeforeRebate, 12_500);
  }

  const taxAfterRebate = Math.max(0, taxBeforeRebate - rebate87a);
  const cess = Math.round(taxAfterRebate * HEALTH_EDU_CESS);
  const totalTax = taxAfterRebate + cess;
  const monthlyTds = gross > 0 ? Math.round(totalTax / 12) : 0;
  const effectiveRate = gross > 0 ? Math.round((totalTax / gross) * 1000) / 10 : 0;
  const takeHomeAnnual = Math.max(0, gross - totalTax);

  return {
    regime,
    annualGrossIncome: gross,
    standardDeduction: std,
    chapterViaDeductions: chapterVia,
    taxableIncome: taxable,
    taxBeforeRebate,
    rebate87a,
    taxAfterRebate,
    cess,
    totalTax,
    monthlyTds,
    effectiveRatePercent: effectiveRate,
    takeHomeAnnual,
    takeHomeMonthly: Math.round(takeHomeAnnual / 12),
    disclaimer:
      "Rough estimate for planning only. Actual tax depends on exemptions, other income, and your CA or the tax portal.",
  };
}
