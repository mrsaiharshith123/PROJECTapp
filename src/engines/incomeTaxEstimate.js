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
const MAX_80CCD1B = 50_000;
const DEFAULT_PROFESSIONAL_TAX = 2_400;
const REBATE_87A_NEW = { incomeCap: 1_200_000, maxRebate: 60_000 };
const HEALTH_EDU_CESS = 0.04;

/**
 * HRA exemption (old regime): minimum of actual HRA, rent − 10% salary, 50%/40% of salary.
 */
export function computeHraExemption({
  annualSalary,
  annualHraReceived = 0,
  annualRentPaid = 0,
  isMetro = true,
}) {
  const salary = Math.max(0, Number(annualSalary) || 0);
  const hra = Math.max(0, Number(annualHraReceived) || 0);
  const rent = Math.max(0, Number(annualRentPaid) || 0);
  if (salary <= 0 || rent <= 0) return 0;

  const tenPctSalary = salary * 0.1;
  const rentMinusTen = Math.max(0, rent - tenPctSalary);
  const salaryCap = salary * (isMetro ? 0.5 : 0.4);
  return Math.round(Math.min(hra || rent, rentMinusTen, salaryCap));
}

/**
 * Auto-read SIP → 80C, Insurance → 80D, Rent → annual rent from open commitments.
 */
export function deriveTaxDeductionsFromCommitments(commitments, getEffectiveStatus) {
  let annual80c = 0;
  let annual80d = 0;
  let annualRent = 0;

  for (const c of commitments || []) {
    if (getEffectiveStatus(c) === "paid") continue;
    const amt = Math.max(0, Number(c.amount) || 0);
    const repeat = c.repeatType || "none";
    const annual = repeat === "yearly" ? amt : repeat === "monthly" ? amt * 12 : amt;

    if (c.category === "SIP") annual80c += annual;
    if (c.category === "Insurance") annual80d += annual;
    if (c.category === "Rent") annualRent += annual;
  }

  return {
    deduction80c: Math.min(MAX_80C, Math.round(annual80c)),
    deduction80d: Math.round(annual80d),
    annualRentPaid: Math.round(annualRent),
    sources: {
      sip80c: Math.round(annual80c),
      insurance80d: Math.round(annual80d),
      rent: Math.round(annualRent),
    },
  };
}

function buildTaxInsights(result, input) {
  const insights = [];
  const used80c = Math.min(MAX_80C, Number(input.deduction80c) || 0);
  const room80c = MAX_80C - used80c;
  if (room80c > 5_000 && input.regime === "old") {
    insights.push(`Additional ₹${room80c.toLocaleString("en-IN")} deduction room available under 80C.`);
  }
  const nps = Math.min(MAX_80CCD1B, Number(input.deduction80ccd1b) || 0);
  if (nps < MAX_80CCD1B && input.regime === "old") {
    insights.push("NPS contribution under 80CCD(1B) could reduce tax liability further.");
  }
  if (result.hraExemption > 0) {
    insights.push(`HRA exemption of ₹${result.hraExemption.toLocaleString("en-IN")} applied from rent data.`);
  }
  return insights;
}

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
 * @param {number} [input.deduction80ccd1b]
 * @param {number} [input.professionalTax]
 * @param {number} [input.annualHraReceived]
 * @param {number} [input.annualRentPaid]
 * @param {boolean} [input.isMetro]
 * @param {number} [input.otherDeductions]
 */
export function estimateIncomeTax(input) {
  const gross = Math.max(0, Number(input.annualGrossIncome) || 0);
  const regime = input.regime === "old" ? "old" : "new";
  const std = STANDARD_DEDUCTION[regime];
  const c80 = Math.min(MAX_80C, Math.max(0, Number(input.deduction80c) || 0));
  const d80 = Math.max(0, Number(input.deduction80d) || 0);
  const ccd1b = Math.min(MAX_80CCD1B, Math.max(0, Number(input.deduction80ccd1b) || 0));
  const profTax =
    input.professionalTax != null
      ? Math.max(0, Number(input.professionalTax) || 0)
      : DEFAULT_PROFESSIONAL_TAX;
  const other = Math.max(0, Number(input.otherDeductions) || 0);

  const hraExemption =
    regime === "old"
      ? computeHraExemption({
          annualSalary: gross,
          annualHraReceived: Number(input.annualHraReceived) || 0,
          annualRentPaid: Number(input.annualRentPaid) || 0,
          isMetro: input.isMetro !== false,
        })
      : 0;

  const chapterVia =
    regime === "old" ? c80 + d80 + ccd1b + hraExemption + profTax + other : 0;
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

  const result = {
    regime,
    annualGrossIncome: gross,
    standardDeduction: std,
    deduction80c: c80,
    deduction80d: d80,
    deduction80ccd1b: ccd1b,
    professionalTax: profTax,
    hraExemption,
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
    optimizationInsights: [],
  };
  result.optimizationInsights = buildTaxInsights(result, input);
  return result;
}
