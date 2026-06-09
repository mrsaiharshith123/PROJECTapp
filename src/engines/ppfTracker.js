/** PPF projection — annual deposits, govt-style compounded interest (education only). */

const DEFAULT_ANNUAL_RATE = 0.071;
const MAX_ANNUAL_DEPOSIT = 150_000;

/**
 * @param {object} input
 * @param {number} input.annualContribution
 * @param {number} [input.currentCorpus]
 * @param {number} [input.yearsRemaining]
 * @param {number} [input.growthRate]
 */
export function computePpfProjection(input) {
  const annual = Math.min(MAX_ANNUAL_DEPOSIT, Math.max(0, Number(input.annualContribution) || 0));
  const corpus = Math.max(0, Number(input.currentCorpus) || 0);
  const years = Math.max(1, Math.floor(Number(input.yearsRemaining) || 15));
  const rate = Math.min(0.12, Math.max(0.05, Number(input.growthRate) || DEFAULT_ANNUAL_RATE));

  let balance = corpus;
  for (let y = 0; y < years; y++) {
    balance = (balance + annual) * (1 + rate);
  }

  const totalDeposits = corpus + annual * years;
  const narrativeLines = [
    `Annual PPF deposit (80C cap ₹1.5L): up to ₹${annual.toLocaleString("en-IN")}.`,
    `Assumed interest ${Math.round(rate * 1000) / 10}% p.a. compounded yearly.`,
  ];
  if (annual < 50_000) {
    narrativeLines.push("Higher annual deposits improve long-term tax-free corpus.");
  }

  return {
    annualContribution: Math.round(annual),
    maxAnnualDeposit: MAX_ANNUAL_DEPOSIT,
    currentCorpus: Math.round(corpus),
    projectedCorpus: Math.round(balance),
    yearsProjected: years,
    totalDeposits: Math.round(totalDeposits),
    growthRatePercent: Math.round(rate * 1000) / 10,
    narrativeLines,
  };
}
