import { addMonths, format, parseISO } from "date-fns";

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
 * @returns {{ rows: { name: string, month: number, baseline: number, whatIf: number }[], baselineMonths: number, acceleratedMonths: number, baselineTotalPaid: number, acceleratedTotalPaid: number }}
 */
export function buildPrepaymentBalanceSeries({
  principalOutstanding,
  annualRatePercent,
  scheduledEmi,
  extraMonthly = 0,
  extraByMonth = null,
}) {
  const P0 = Math.max(0, Number(principalOutstanding) || 0);
  const r = Math.max(0, Number(annualRatePercent) || 0) / 100 / 12;
  const emi = Math.max(0, Number(scheduledEmi) || 0);
  if (P0 <= 0 || emi <= 0) {
    return {
      rows: [],
      baselineMonths: 0,
      acceleratedMonths: 0,
      baselineTotalPaid: 0,
      acceleratedTotalPaid: 0,
    };
  }

  const baseline = runLoanSchedule(P0, r, emi, 0);
  const accelerated = runLoanSchedule(P0, r, emi, (month) => {
    if (extraByMonth && typeof extraByMonth === "object") {
      return extraByMonth[month] ?? extraByMonth[String(month)] ?? 0;
    }
    return extraMonthly;
  });

  const maxMonth = Math.max(
    baseline.points[baseline.points.length - 1]?.month ?? 0,
    accelerated.points[accelerated.points.length - 1]?.month ?? 0,
  );
  const baseBal = new Map(baseline.points.map((p) => [p.month, p.balance]));
  const accBal = new Map(accelerated.points.map((p) => [p.month, p.balance]));

  const rows = [];
  let lastBase = Math.round(P0);
  let lastAcc = Math.round(P0);
  for (let m = 0; m <= maxMonth; m += 1) {
    if (baseBal.has(m)) lastBase = baseBal.get(m);
    if (accBal.has(m)) lastAcc = accBal.get(m);
    const extra =
      m === 0
        ? 0
        : extraByMonth && typeof extraByMonth === "object"
          ? Math.round(Number(extraByMonth[m] ?? extraByMonth[String(m)]) || 0)
          : Math.round(Number(extraMonthly) || 0);
    rows.push({
      month: m,
      name: chartLabelForMonth(m),
      baseline: lastBase,
      whatIf: lastAcc,
      emiPay: m === 0 ? 0 : Math.round(emi),
      extraPay: extra,
      totalPay: m === 0 ? 0 : Math.round(emi + extra),
    });
  }

  return {
    rows,
    baselineMonths: baseline.months,
    acceleratedMonths: accelerated.months,
    baselineTotalPaid: baseline.cumulativePaid,
    acceleratedTotalPaid: accelerated.cumulativePaid,
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

export function payoffLabelFromMonths(months, todayStr) {
  const n = Math.max(0, Math.floor(Number(months) || 0));
  if (!todayStr || n <= 0) return "";
  try {
    return format(addMonths(parseISO(`${todayStr}T12:00:00`), n), "MMM yyyy");
  } catch {
    return "";
  }
}

function runLoanSchedule(P0, r, emi, extraForMonth) {
  let bal = P0;
  let months = 0;
  let cumulativePaid = 0;
  let interestPaid = 0;
  const points = [{ month: 0, balance: Math.round(bal), cumulativePaid: 0 }];
  const maxMonths = 600;
  while (bal > 0.01 && months < maxMonths) {
    months += 1;
    const interest = bal * r;
    interestPaid += interest;
    const extra =
      typeof extraForMonth === "function" ? Math.max(0, extraForMonth(months)) : Math.max(0, Number(extraForMonth) || 0);
    const towardPrincipal = Math.min(bal, emi - interest + extra);
    if (towardPrincipal <= 0 && emi + extra <= interest) break;
    cumulativePaid += interest + towardPrincipal;
    bal = Math.max(0, bal - towardPrincipal);
    points.push({ month: months, balance: Math.round(bal), cumulativePaid: Math.round(cumulativePaid) });
  }
  return { months, interestPaid, cumulativePaid: Math.round(cumulativePaid), points };
}

function chartLabelForMonth(m) {
  if (m === 0) return "0";
  if (m % 12 === 0) return `Y${m / 12}`;
  if (m % 6 === 0) return String(m);
  return `_${m}`;
}

/**
 * Cumulative total paid — regular EMI vs with extra (flat or lumpy).
 */
export function buildCumulativePaidSeries({
  principalOutstanding,
  annualRatePercent,
  scheduledEmi,
  extraMonthly = 0,
  extraByMonth = null,
}) {
  const P0 = Math.max(0, Number(principalOutstanding) || 0);
  const r = Math.max(0, Number(annualRatePercent) || 0) / 100 / 12;
  const emi = Math.max(0, Number(scheduledEmi) || 0);
  if (P0 <= 0 || emi <= 0) {
    return { rows: [], baselineMonths: 0, acceleratedMonths: 0, baselineTotalPaid: 0, acceleratedTotalPaid: 0 };
  }

  const baseline = runLoanSchedule(P0, r, emi, 0);
  const accelerated = runLoanSchedule(P0, r, emi, (month) => {
    if (extraByMonth && typeof extraByMonth === "object") {
      return extraByMonth[month] ?? extraByMonth[String(month)] ?? 0;
    }
    return extraMonthly;
  });

  const maxMonth = Math.max(
    baseline.points[baseline.points.length - 1]?.month ?? 0,
    accelerated.points[accelerated.points.length - 1]?.month ?? 0,
  );
  const baseMap = new Map(baseline.points.map((p) => [p.month, p.cumulativePaid]));
  const accMap = new Map(accelerated.points.map((p) => [p.month, p.cumulativePaid]));

  const rows = [];
  let lastBase = 0;
  let lastAcc = 0;
  for (let m = 0; m <= maxMonth; m += 1) {
    if (baseMap.has(m)) lastBase = baseMap.get(m);
    if (accMap.has(m)) lastAcc = accMap.get(m);
    rows.push({
      month: m,
      name: chartLabelForMonth(m),
      baseline: lastBase,
      whatIf: lastAcc,
    });
  }

  return {
    rows,
    baselineMonths: baseline.months,
    acceleratedMonths: accelerated.months,
    baselineTotalPaid: baseline.cumulativePaid,
    acceleratedTotalPaid: accelerated.cumulativePaid,
    baselineInterest: Math.round(baseline.interestPaid),
    acceleratedInterest: Math.round(accelerated.interestPaid),
  };
}

/**
 * Build month-indexed extras from timing advice rows (light months only).
 * @param {{ extraCapacity?: number, goodForExtra?: boolean }[]} adviceRows
 */
/**
 * Thin month rows for charts — unique x labels, fewer dots.
 * @param {{ month: number, name: string, baseline: number, whatIf: number }[]} rows
 * @param {number} [maxPoints]
 */
export function sampleLoanChartRows(rows, maxPoints = 40) {
  if (!rows?.length || rows.length <= maxPoints) return rows || [];
  const step = Math.max(1, Math.floor(rows.length / maxPoints));
  const last = rows[rows.length - 1];
  const picked = rows.filter((r) => r.month === 0 || r.month % step === 0);
  if (picked[picked.length - 1]?.month !== last.month) picked.push(last);
  return picked;
}

export function extrasFromTimingRows(adviceRows) {
  /** @type {Record<number, number>} */
  const map = {};
  (adviceRows || []).forEach((row) => {
    const extra = Math.round(Number(row.recommendedExtra ?? row.extraCapacity) || 0);
    if (row.goodForExtra && extra > 0) {
      const loanMonth = (row.offset ?? 0) + 1;
      map[loanMonth] = extra;
    }
  });
  return map;
}

