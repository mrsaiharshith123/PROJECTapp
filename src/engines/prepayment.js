/**
 * Reducing-balance loan simulation (monthly rests).
 * @param {object} params
 * @param {number} params.principalOutstanding — current principal
 * @param {number} params.annualRatePercent — nominal annual % (e.g. 10.5)
 * @param {number} params.scheduledEmi — base EMI (principal+interest)
 * @param {number} params.extraMonthly — additional principal payment each month
 */
export function simulatePrepayment({ principalOutstanding, annualRatePercent, scheduledEmi, extraMonthly }) {
  const P0 = Math.max(0, Number(principalOutstanding) || 0);
  const r = Math.max(0, Number(annualRatePercent) || 0) / 100 / 12;
  const emi = Math.max(0, Number(scheduledEmi) || 0);
  const extra = Math.max(0, Number(extraMonthly) || 0);

  function run(extraPay, collectSeries = false) {
    let bal = P0;
    let months = 0;
    let interestPaid = 0;
    /** @type {{ month: number, balance: number }[] | null} */
    const points = collectSeries ? [{ month: 0, balance: Math.round(bal) }] : null;
    const maxMonths = 600;
    while (bal > 0.01 && months < maxMonths) {
      months += 1;
      const interest = bal * r;
      interestPaid += interest;
      const towardPrincipal = Math.min(bal, emi - interest + extraPay);
      if (towardPrincipal <= 0 && emi + extraPay <= interest) break;
      bal = Math.max(0, bal - towardPrincipal);
      if (points) points.push({ month: months, balance: Math.round(bal) });
    }
    return { months, interestPaid, finalBalance: bal, points };
  }

  const baseline = run(0);
  const accelerated = run(extra);

  const monthsSaved = Math.max(0, baseline.months - accelerated.months);
  const interestSaved = Math.max(0, baseline.interestPaid - accelerated.interestPaid);

  return {
    baselineMonths: baseline.months,
    acceleratedMonths: accelerated.months,
    monthsSaved,
    baselineInterest: baseline.interestPaid,
    acceleratedInterest: accelerated.interestPaid,
    interestSaved,
  };
}

/**
 * EMI from principal, annual rate, tenure months (standard annuity).
 */
/**
 * Month-by-month outstanding balance — baseline vs with extra payment.
 * @returns {{ rows: { name: string, month: number, baseline: number, whatIf: number }[], baselineMonths: number, acceleratedMonths: number }}
 */
export function buildPrepaymentBalanceSeries({
  principalOutstanding,
  annualRatePercent,
  scheduledEmi,
  extraMonthly,
}) {
  const P0 = Math.max(0, Number(principalOutstanding) || 0);
  const r = Math.max(0, Number(annualRatePercent) || 0) / 100 / 12;
  const emi = Math.max(0, Number(scheduledEmi) || 0);
  const extra = Math.max(0, Number(extraMonthly) || 0);
  if (P0 <= 0 || emi <= 0) return { rows: [], baselineMonths: 0, acceleratedMonths: 0 };

  function run(extraPay) {
    let bal = P0;
    let months = 0;
    const points = [{ month: 0, balance: Math.round(bal) }];
    const maxMonths = 600;
    while (bal > 0.01 && months < maxMonths) {
      months += 1;
      const interest = bal * r;
      const towardPrincipal = Math.min(bal, emi - interest + extraPay);
      if (towardPrincipal <= 0 && emi + extraPay <= interest) break;
      bal = Math.max(0, bal - towardPrincipal);
      points.push({ month: months, balance: Math.round(bal) });
    }
    return { months, points };
  }

  const baseline = run(0);
  const accelerated = run(extra);
  const maxMonth = Math.max(
    baseline.points[baseline.points.length - 1]?.month ?? 0,
    accelerated.points[accelerated.points.length - 1]?.month ?? 0,
  );

  const baselineByMonth = new Map(baseline.points.map((p) => [p.month, p.balance]));
  const acceleratedByMonth = new Map(accelerated.points.map((p) => [p.month, p.balance]));

  const rows = [];
  for (let m = 0; m <= maxMonth; m += 1) {
    const label = m === 0 ? "0" : m % 12 === 0 ? `Y${m / 12}` : m % 6 === 0 ? String(m) : "";
    rows.push({
      month: m,
      name: label || `_${m}`,
      baseline: baselineByMonth.get(m) ?? 0,
      whatIf: acceleratedByMonth.get(m) ?? 0,
    });
  }

  return {
    rows,
    baselineMonths: baseline.months,
    acceleratedMonths: accelerated.months,
  };
}

/**
 * Rough pressure-score delta once this loan EMI (and optional extra) ends.
 */
export function estimateLoanPayoffStressDelta({
  monthlyIncome,
  monthlyBurdenExcludingThisEmi,
  emi,
  extraMonthly = 0,
}) {
  const income = Math.max(0, Number(monthlyIncome) || 0);
  const burdenBase = Math.max(0, Number(monthlyBurdenExcludingThisEmi) || 0);
  const emiAmt = Math.max(0, Number(emi) || 0);
  const extra = Math.max(0, Number(extraMonthly) || 0);
  if (income <= 0) return null;

  const during = Math.min(100, Math.round(((burdenBase + emiAmt + extra) / income) * 100));
  const after = Math.min(100, Math.round((burdenBase / income) * 100));
  return { during, after, delta: Math.max(0, during - after) };
}

export function computeEmiFromPrincipal(principal, annualRatePercent, tenureMonths) {
  const P = Math.max(0, Number(principal) || 0);
  const n = Math.max(1, Math.floor(Number(tenureMonths) || 1));
  const r = Math.max(0, Number(annualRatePercent) || 0) / 100 / 12;
  if (r === 0) return P / n;
  const factor = Math.pow(1 + r, n);
  return (P * r * factor) / (factor - 1);
}
