/**
 * SIP future value and goal planning (education only).
 */

/**
 * @param {number} monthlySip
 * @param {number} months
 * @param {number} annualRate e.g. 0.12 for 12%
 */
export function sipFutureValue(monthlySip, months, annualRate = 0.12) {
  const p = Math.max(0, Number(monthlySip) || 0);
  const n = Math.max(0, Math.floor(Number(months) || 0));
  const r = Math.max(0, Number(annualRate) || 0) / 12;
  if (p <= 0 || n <= 0) return 0;
  if (r <= 0) return Math.round(p * n);
  const fv = p * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  return Math.round(fv);
}

/**
 * Months needed to reach target with fixed SIP.
 */
export function monthsToSipGoal(monthlySip, targetAmount, annualRate = 0.12) {
  const p = Math.max(0, Number(monthlySip) || 0);
  const target = Math.max(0, Number(targetAmount) || 0);
  if (p <= 0 || target <= 0) return null;
  const r = Math.max(0, Number(annualRate) || 0) / 12;
  if (r <= 0) return Math.ceil(target / p);
  let balance = 0;
  let months = 0;
  while (balance < target && months < 600) {
    balance = balance * (1 + r) + p;
    months += 1;
  }
  return months > 600 ? null : months;
}

/**
 * @param {object} input
 * @param {number} input.monthlySip
 * @param {number} [input.years]
 * @param {number} [input.targetAmount]
 * @param {number} [input.annualReturn]
 * @param {number} [input.monthlyFreeCash] affordability hint
 */
export function analyzeSipPlan(input) {
  const sip = Math.max(0, Number(input.monthlySip) || 0);
  const years = Math.max(1, Math.floor(Number(input.years) || 10));
  const months = years * 12;
  const rate = Math.min(0.18, Math.max(0.06, Number(input.annualReturn) || 0.12));
  const target = Math.max(0, Number(input.targetAmount) || 0);
  const freeCash = Math.max(0, Number(input.monthlyFreeCash) || 0);

  const projected = sipFutureValue(sip, months, rate);
  const monthsForGoal = target > 0 ? monthsToSipGoal(sip, target, rate) : null;
  const affordable = freeCash <= 0 || sip <= freeCash * 0.4;

  const narrativeLines = [];
  if (sip > 0) {
    narrativeLines.push(
      `₹${sip.toLocaleString("en-IN")}/month for ${years} years → about ₹${projected.toLocaleString("en-IN")} at ${Math.round(rate * 100)}% p.a.`,
    );
  }
  if (target > 0 && monthsForGoal) {
    const yrs = Math.round((monthsForGoal / 12) * 10) / 10;
    narrativeLines.push(`Goal ₹${target.toLocaleString("en-IN")} reachable in about ${yrs} years at this SIP.`);
  }
  if (freeCash > 0 && !affordable) {
    narrativeLines.push("SIP exceeds 40% of free cash — pressure may rise if bills are tight.");
  } else if (freeCash > 0 && affordable) {
    narrativeLines.push("SIP fits within a conservative share of monthly free cash.");
  }

  return {
    monthlySip: Math.round(sip),
    years,
    projectedCorpus: projected,
    targetAmount: Math.round(target),
    monthsToGoal: monthsForGoal,
    annualReturnPercent: Math.round(rate * 100),
    affordable,
    narrativeLines,
  };
}
