/** NPS corpus projection + 80CCD deduction hints (education only). */

const MAX_80CCD1B = 50_000;
const DEFAULT_GROWTH = 0.1;

/**
 * @param {object} input
 * @param {number} input.monthlyEmployee
 * @param {number} [input.monthlyEmployer]
 * @param {number} [input.currentCorpus]
 * @param {number} [input.age]
 * @param {number} [input.retirementAge]
 * @param {number} [input.growthRate]
 */
export function computeNpsProjection(input) {
  const employee = Math.max(0, Number(input.monthlyEmployee) || 0);
  const employer = Math.max(0, Number(input.monthlyEmployer) || 0);
  const monthly = employee + employer;
  const corpus = Math.max(0, Number(input.currentCorpus) || 0);
  const age = Math.max(18, Math.floor(Number(input.age) || 30));
  const retirementAge = Math.max(age + 1, Math.floor(Number(input.retirementAge) || 60));
  const growth = Math.min(0.15, Math.max(0.06, Number(input.growthRate) || DEFAULT_GROWTH));

  const monthsLeft = (retirementAge - age) * 12;
  const monthlyGrowth = Math.pow(1 + growth, 1 / 12) - 1;
  let projected = corpus;
  for (let m = 0; m < monthsLeft; m++) {
    projected = projected * (1 + monthlyGrowth) + monthly;
  }

  const annualEmployee = employee * 12;
  const deduction80ccd1b = Math.min(MAX_80CCD1B, annualEmployee);
  const narrativeLines = [
    `Monthly NPS (you + employer): about ₹${monthly.toLocaleString("en-IN")}.`,
    `Up to ₹${deduction80ccd1b.toLocaleString("en-IN")}/yr may qualify under 80CCD(1B) in old regime.`,
  ];

  return {
    monthlyEmployee: Math.round(employee),
    monthlyEmployer: Math.round(employer),
    monthlyTotal: Math.round(monthly),
    currentCorpus: Math.round(corpus),
    projectedCorpusAtRetirement: Math.round(projected),
    yearsToRetirement: retirementAge - age,
    deduction80ccd1b,
    growthRatePercent: Math.round(growth * 1000) / 10,
    narrativeLines,
  };
}

/**
 * Blend EPF + NPS + PPF for a simple retirement mix read.
 */
export function computeRetirementMix({ epf = 0, ppf = 0, nps = 0 }) {
  const total = Math.max(0, epf) + Math.max(0, ppf) + Math.max(0, nps);
  if (total <= 0) {
    return { total: 0, shares: [], message: "Enter corpus projections to see your retirement mix." };
  }
  const parts = [
    { id: "epf", label: "EPF", amount: epf },
    { id: "ppf", label: "PPF", amount: ppf },
    { id: "nps", label: "NPS", amount: nps },
  ].filter((p) => p.amount > 0);
  const shares = parts.map((p) => ({
    ...p,
    percent: Math.round((p.amount / total) * 100),
  }));
  return {
    total: Math.round(total),
    shares,
    message: `Projected retirement corpus about ₹${total.toLocaleString("en-IN")} across ${parts.length} pillar(s).`,
  };
}
