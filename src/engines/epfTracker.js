/**
 * EPF estimation for formal salaried employees (pure math — no API).
 * Assumes 12% employee + 12% employer on basic salary component.
 */

const DEFAULT_EMPLOYEE_RATE = 0.12;
const DEFAULT_EMPLOYER_RATE = 0.12;
const DEFAULT_GROWTH_RATE = 0.08;

/**
 * @param {object} input
 * @param {number} input.monthlyBasicSalary Basic salary component (not always full gross)
 * @param {number} [input.currentCorpus]
 * @param {number} [input.age]
 * @param {number} [input.retirementAge]
 * @param {number} [input.growthRate] annual corpus growth assumption
 */
export function computeEpfProjection(input) {
  const basic = Math.max(0, Number(input.monthlyBasicSalary) || 0);
  const corpus = Math.max(0, Number(input.currentCorpus) || 0);
  const age = Math.max(18, Math.floor(Number(input.age) || 30));
  const retirementAge = Math.max(age + 1, Math.floor(Number(input.retirementAge) || 60));
  const growth = Math.min(0.15, Math.max(0.04, Number(input.growthRate) || DEFAULT_GROWTH_RATE));

  const monthlyEmployee = Math.round(basic * DEFAULT_EMPLOYEE_RATE);
  const monthlyEmployer = Math.round(basic * DEFAULT_EMPLOYER_RATE);
  const monthlyTotal = monthlyEmployee + monthlyEmployer;

  const yearsLeft = retirementAge - age;
  const monthsLeft = yearsLeft * 12;

  let projected = corpus;
  const monthlyGrowth = Math.pow(1 + growth, 1 / 12) - 1;
  for (let m = 0; m < monthsLeft; m++) {
    projected = projected * (1 + monthlyGrowth) + monthlyTotal;
  }

  const adequacy =
    projected >= basic * 12 * 10 ? "strong" : projected >= basic * 12 * 5 ? "moderate" : "building";

  const narrativeLines = [];
  narrativeLines.push(
    `Monthly EPF contribution (employee + employer): about ₹${monthlyTotal.toLocaleString("en-IN")}.`,
  );
  if (adequacy === "building") {
    narrativeLines.push("EPF corpus is still building — long tenure will compound meaningfully.");
  } else if (adequacy === "strong") {
    narrativeLines.push("Projected EPF corpus supports a meaningful retirement pillar.");
  }

  return {
    monthlyEmployee,
    monthlyEmployer,
    monthlyTotal,
    annualContribution: monthlyTotal * 12,
    currentCorpus: Math.round(corpus),
    projectedCorpusAtRetirement: Math.round(projected),
    yearsToRetirement: yearsLeft,
    adequacy,
    growthRatePercent: Math.round(growth * 1000) / 10,
    narrativeLines,
  };
}

/** Estimate basic as ~40% of gross if not provided. */
export function estimateBasicFromGross(monthlyGross) {
  const g = Math.max(0, Number(monthlyGross) || 0);
  return Math.round(g * 0.4);
}
