import { addMonths, differenceInCalendarMonths, format, parseISO } from "date-fns";
import { isBillDueInMonth } from "../constants/repeatTypes.js";
import { freeMoneyAfterBurden } from "./pressureScore.js";

export const DEFAULT_FOREMAN_PCT = 5;

/** @typedef {'equal' | 'decreasing' | 'custom'} ChitInstallmentMode */

export const CHIT_INSTALLMENT_MODES = /** @type {const} */ (["equal", "decreasing", "custom"]);

/**
 * Equal monthly share (very common for large chits: value ÷ months).
 */
export function chitEqualInstallment(chitValue, totalMonths) {
  const V = Math.max(0, Number(chitValue) || 0);
  const N = Math.max(1, Math.floor(Number(totalMonths) || 1));
  return Math.round(V / N);
}

/**
 * Decreasing installment schedule (classic pattern).
 * Month 1 is highest; month N is lowest. Sum of all installments = chitValue.
 */
export function chitInstallment(chitValue, totalMonths, monthIndex) {
  const V = Math.max(0, Number(chitValue) || 0);
  const N = Math.max(1, Math.floor(Number(totalMonths) || 1));
  const m = Math.min(N, Math.max(1, Math.floor(Number(monthIndex) || 1)));
  if (V <= 0) return 0;
  return (2 * V) / (N * (N + 1)) * (N - m + 1);
}

/**
 * @param {ChitInstallmentMode} [mode]
 * @param {number|null} [customAmount] fixed installment when mode is custom
 */
export function resolveChitInstallment(
  chitValue,
  totalMonths,
  monthIndex,
  mode = "equal",
  customAmount = null
) {
  if (mode === "custom") {
    const fixed = Math.max(0, Number(customAmount) || 0);
    if (fixed > 0) return Math.round(fixed);
  }
  if (mode === "decreasing") {
    return Math.round(chitInstallment(chitValue, totalMonths, monthIndex));
  }
  return chitEqualInstallment(chitValue, totalMonths);
}

/** After N installments paid, you are on month N+1 (capped at total months). */
export function chitCurrentMonthFromMonthsPaid(monthsPaid, totalMonths) {
  const paid = Math.max(0, Math.floor(Number(monthsPaid) || 0));
  const N = Math.max(1, Math.floor(Number(totalMonths) || 1));
  return Math.min(N, paid + 1);
}

export function buildChitInstallmentSchedule(
  chitValue,
  totalMonths,
  mode = "equal",
  customAmount = null
) {
  const N = Math.max(1, Math.floor(Number(totalMonths) || 1));
  const rows = [];
  for (let m = 1; m <= N; m++) {
    rows.push({
      month: m,
      installment: resolveChitInstallment(chitValue, N, m, /** @type {ChitInstallmentMode} */ (mode), customAmount),
    });
  }
  return rows;
}

/** Auction discount (₹) from actual cash received at the draw. */
export function chitDiscountFromPayout(chitValue, payout, foremanPct = DEFAULT_FOREMAN_PCT) {
  const V = Math.max(0, Number(chitValue) || 0);
  const P = Math.max(0, Number(payout) || 0);
  const foreman = Math.round(V * (Math.max(0, Number(foremanPct) || 0) / 100));
  return Math.max(0, Math.round(V - P - foreman));
}

export function scheduleTotal(schedule) {
  return schedule.reduce((s, r) => s + r.installment, 0);
}

/** Calendar month index (1..N) from chit start date. */
export function deriveChitCurrentMonth(startDateYmd, totalMonths, todayYmd) {
  if (!startDateYmd) return 1;
  const N = Math.max(1, Math.floor(Number(totalMonths) || 1));
  try {
    const start = parseISO(`${startDateYmd.slice(0, 7)}-01T12:00:00`);
    const today = parseISO(`${(todayYmd || "").slice(0, 7)}-01T12:00:00`);
    const m = differenceInCalendarMonths(today, start) + 1;
    return Math.min(N, Math.max(1, m));
  } catch {
    return 1;
  }
}

export function chitMonthToCalendarKey(startDateYmd, chitMonthIndex) {
  if (!startDateYmd) return "";
  try {
    const d = addMonths(parseISO(`${startDateYmd}T12:00:00`), Math.max(0, chitMonthIndex - 1));
    return format(d, "yyyy-MM");
  } catch {
    return "";
  }
}

/**
 * Typical auction discount as % of chit value (early months = higher discount / more loss).
 */
export function estimatedDiscountPercent(monthIndex, totalMonths) {
  const N = Math.max(1, Math.floor(Number(totalMonths) || 1));
  const m = Math.min(N, Math.max(1, Math.floor(Number(monthIndex) || 1)));
  const early = 0.3;
  const late = 0.05;
  if (N === 1) return early;
  const t = (m - 1) / (N - 1);
  return early - (early - late) * t;
}

export function chitPayout(chitValue, discountAmount, foremanPct = DEFAULT_FOREMAN_PCT) {
  const V = Math.max(0, Number(chitValue) || 0);
  const D = Math.max(0, Math.min(V, Number(discountAmount) || 0));
  const foreman = V * (Math.max(0, Number(foremanPct) || 0) / 100);
  return Math.max(0, Math.round(V - D - foreman));
}

/** Money you give up vs full chit value when taking the pot (discount + foreman). */
export function chitEffectiveLoss(chitValue, discountAmount, foremanPct = DEFAULT_FOREMAN_PCT) {
  const V = Math.max(0, Number(chitValue) || 0);
  return Math.max(0, Math.round(V - chitPayout(V, discountAmount, foremanPct)));
}

export function maxAcceptableLoss(chitValue, maxLossPercent) {
  const V = Math.max(0, Number(chitValue) || 0);
  const pct = Math.min(0.4, Math.max(0.05, Number(maxLossPercent) || 0.18));
  return Math.round(V * pct);
}

/**
 * Suggest max auction loss (discount + foreman) from income, dues, debt, and pressure.
 */
export function suggestMaxAcceptableLoss({
  chitValue,
  monthlyIncome = 0,
  commitments = [],
  getEffectiveStatus,
  liquidSavings = 0,
}) {
  const V = Math.max(0, Number(chitValue) || 0);
  const income = Math.max(0, Number(monthlyIncome) || 0);
  const baseline = freeMoneyAfterBurden(commitments, income, getEffectiveStatus);
  const burdenRatio = income > 0 ? baseline.monthlyBurden / income : baseline.monthlyBurden > 0 ? 1 : 0;

  let openDebt = 0;
  let overdueCount = 0;
  for (const c of commitments) {
    const st = getEffectiveStatus(c);
    if (st === "paid") continue;
    openDebt += Math.max(0, Number(c.remainingAmount ?? c.amount) || 0);
    if (st === "overdue") overdueCount += 1;
  }

  let pct = 0.2;
  const reasons = [];

  if (income <= 0) {
    pct = 0.12;
    reasons.push("Set income in Profile to calculate a more precise loss cap.");
  } else {
    if (burdenRatio > 0.75) {
      pct -= 0.07;
      reasons.push("Bills use over 75% of income — keep auction loss small.");
    } else if (burdenRatio > 0.55) {
      pct -= 0.04;
      reasons.push("Monthly dues are heavy vs income.");
    } else if (burdenRatio < 0.35 && baseline.freeMoney > income * 0.2) {
      pct += 0.03;
      reasons.push("Available free cash is sufficient — a slightly higher loss may be acceptable.");
    }

    if (baseline.freeMoney < income * 0.08) {
      pct -= 0.04;
      reasons.push("Very little left after monthly bills.");
    }

    if (openDebt > income * 4) {
      pct -= 0.03;
      reasons.push("High total open balances — prefer a lower discount.");
    } else if (openDebt > income * 2) {
      pct -= 0.015;
    }
  }

  if (overdueCount > 0) {
    pct -= Math.min(0.08, overdueCount * 0.025);
    reasons.push(
      overdueCount === 1
        ? "You have an overdue bill — avoid pursuing a large auction discount at this time."
        : `${overdueCount} overdue bills — take chit only if truly urgent.`
    );
  }

  const savings = Math.max(0, Number(liquidSavings) || 0);
  if (savings > income * 3 && burdenRatio < 0.5) {
    pct += 0.02;
    reasons.push("Liquid savings give you room for a planned early take.");
  }

  pct = Math.min(0.28, Math.max(0.08, pct));

  const pctCap = Math.round(V * pct);
  const cashCap = Math.round(baseline.freeMoney * 2.5 + savings * 0.08);
  const maxLoss = V > 0 ? Math.min(pctCap, cashCap > 0 ? cashCap : pctCap, Math.round(V * 0.3)) : 0;

  if (cashCap < pctCap && V > 0) {
    reasons.push("Capped by what your free cash and savings can absorb.");
  }

  return {
    maxLossPercent: pct,
    maxLoss,
    reasons,
    burdenRatio: Math.round(burdenRatio * 100),
    openDebt: Math.round(openDebt),
    freeCash: Math.round(baseline.freeMoney),
    monthlyBurden: Math.round(baseline.monthlyBurden),
  };
}

function billsDueInMonth(commitments, monthKey, getEffectiveStatus, todayStr, excludeId) {
  let total = 0;
  for (const c of commitments) {
    if (excludeId != null && String(c.id) === String(excludeId)) continue;
    if (!isBillDueInMonth(c, monthKey, getEffectiveStatus, todayStr)) continue;
    total += Math.max(0, Number(c.remainingAmount ?? c.amount) || 0);
  }
  return total;
}

/**
 * Suggest which chit month to take the pot, based on other bills and income.
 */
export function adviseChitTakeMonth({
  chitValue,
  totalMonths,
  currentMonth = 1,
  startDate,
  commitments = [],
  getEffectiveStatus,
  todayStr,
  monthlyIncome = 0,
  maxLossPercent = null,
  foremanPct = DEFAULT_FOREMAN_PCT,
  excludeCommitmentId = null,
  chitTaken = false,
  liquidSavings = 0,
}) {
  const V = Math.max(0, Number(chitValue) || 0);
  const N = Math.max(1, Math.floor(Number(totalMonths) || 1));
  const cur = Math.min(N, Math.max(1, Math.floor(Number(currentMonth) || 1)));
  const income = Math.max(0, Number(monthlyIncome) || 0);
  const lossSuggestion =
    maxLossPercent != null && !Number.isNaN(Number(maxLossPercent))
      ? {
          maxLossPercent: Math.min(0.4, Math.max(0.05, Number(maxLossPercent))),
          maxLoss: maxAcceptableLoss(V, maxLossPercent),
          reasons: ["Using your adjusted loss cap."],
          burdenRatio: null,
          openDebt: null,
          freeCash: null,
          monthlyBurden: null,
        }
      : suggestMaxAcceptableLoss({
          chitValue: V,
          monthlyIncome: income,
          commitments,
          getEffectiveStatus,
          liquidSavings,
        });
  const maxLoss = lossSuggestion.maxLoss;
  const effectiveLossPct = lossSuggestion.maxLossPercent;
  const baseline = freeMoneyAfterBurden(commitments, income, getEffectiveStatus);

  if (chitTaken || V <= 0) {
    return {
      rows: [],
      best: null,
      maxLoss,
      lossSuggestion,
      summary: chitTaken ? "You already took this chit — keep paying installments until the group ends." : "Enter chit value and months.",
    };
  }

  const rows = [];
  for (let m = cur; m <= N; m++) {
    const installment = Math.round(chitInstallment(V, N, m));
    const discountPct = estimatedDiscountPercent(m, N);
    const discountAmt = Math.round(V * discountPct);
    const payout = chitPayout(V, discountAmt, foremanPct);
    const loss = chitEffectiveLoss(V, discountAmt, foremanPct);
    const monthKey = startDate ? chitMonthToCalendarKey(startDate, m) : "";
    const otherBills = monthKey
      ? billsDueInMonth(commitments, monthKey, getEffectiveStatus, todayStr, excludeCommitmentId)
      : baseline.monthlyBurden;
    const totalOut = otherBills + installment;
    const freeAfter = income - totalOut;
    const shortfall = Math.max(0, totalOut - income);
    const lossOk = loss <= maxLoss;
    const needScore = shortfall * 2 + (freeAfter < 0 ? Math.abs(freeAfter) : 0);
    const worthIt = lossOk && (shortfall > 5000 || freeAfter < income * 0.1);

    rows.push({
      month: m,
      monthKey,
      installment,
      discountPct: Math.round(discountPct * 100),
      discountAmt,
      payout,
      loss,
      lossOk,
      otherBills: Math.round(otherBills),
      totalOut: Math.round(totalOut),
      freeAfter: Math.round(freeAfter),
      shortfall: Math.round(shortfall),
      needScore,
      worthIt,
    });
  }

  const eligible = rows.filter((r) => r.lossOk);
  const byNeed = [...eligible].sort((a, b) => b.needScore - a.needScore);
  const byLoss = [...eligible].sort((a, b) => a.loss - b.loss);
  const best = byNeed[0] || rows[0] || null;

  let summary = "No months left in this chit.";
  if (best) {
    if (best.worthIt) {
      summary = `Month ${best.month} looks reasonable: you may need about ${best.shortfall > 0 ? `₹${best.shortfall.toLocaleString("en-IN")} more than income` : "extra headroom"}, payout about ₹${best.payout.toLocaleString("en-IN")} after ~${best.discountPct}% auction discount (loss ~₹${best.loss.toLocaleString("en-IN")}, within your max).`;
    } else if (!best.lossOk) {
      summary = `Early months often cost more than ₹${maxLoss.toLocaleString("en-IN")} in discount — waiting usually reduces loss.`;
    } else {
      summary = `Month ${best.month} has the lowest pressure among remaining months, but loss (~₹${best.loss.toLocaleString("en-IN")}) may not be advisable unless there is a defined requirement.`;
    }
  }

  return {
    rows,
    best,
    lowestLoss: byLoss[0] || null,
    maxLoss,
    maxLossPercent: effectiveLossPct,
    lossSuggestion,
    summary,
    baselineFreeCash: Math.round(baseline.freeMoney),
    baselineBurden: Math.round(baseline.monthlyBurden),
  };
}

/**
 * Newton-Raphson monthly IRR from cash flows (negative = outflow, positive = inflow).
 * @param {number[]} cashFlows ordered by period
 * @param {number} [guess]
 */
export function computeChitIrr(cashFlows, guess = 0.01) {
  const flows = (cashFlows || []).map((f) => Number(f) || 0);
  if (flows.length < 2) return null;

  const npv = (rate) => flows.reduce((s, cf, i) => s + cf / (1 + rate) ** i, 0);
  const dnpv = (rate) =>
    flows.reduce((s, cf, i) => (i === 0 ? s : s - (i * cf) / (1 + rate) ** (i + 1)), 0);

  let rate = guess;
  for (let i = 0; i < 50; i++) {
    const f = npv(rate);
    const df = dnpv(rate);
    if (Math.abs(df) < 1e-10) break;
    const next = rate - f / df;
    if (Math.abs(next - rate) < 1e-7) {
      rate = next;
      break;
    }
    rate = Math.max(-0.99, Math.min(5, next));
  }

  const monthly = rate;
  const annual = (1 + monthly) ** 12 - 1;
  return {
    monthlyIrr: Math.round(monthly * 10000) / 10000,
    annualIrrPercent: Math.round(annual * 1000) / 10,
  };
}

/**
 * Build cash flows for a chit: installments out until payout month, then net payout in.
 */
export function buildChitCashFlows({
  chitValue,
  totalMonths,
  payoutMonth,
  mode = "equal",
  customAmount = null,
  payoutAmount = null,
  foremanPct = DEFAULT_FOREMAN_PCT,
}) {
  const V = Math.max(0, Number(chitValue) || 0);
  const N = Math.max(1, Math.floor(Number(totalMonths) || 1));
  const take = Math.min(N, Math.max(1, Math.floor(Number(payoutMonth) || N)));
  const flows = [];

  for (let m = 1; m <= N; m++) {
    const inst = resolveChitInstallment(V, N, m, /** @type {ChitInstallmentMode} */ (mode), customAmount);
    if (m < take) {
      flows.push(-inst);
    } else if (m === take) {
      const discountPct = estimatedDiscountPercent(take, N);
      const payout =
        payoutAmount != null
          ? Math.max(0, Number(payoutAmount))
          : chitPayout(V, Math.round(V * discountPct), foremanPct);
      flows.push(-inst + payout);
    } else {
      flows.push(-inst);
    }
  }
  return flows;
}

/**
 * Multi-chit portfolio burden and overlap analysis.
 * @param {{ chitCommitments?: object[], monthlyIncome?: number, commitments?: object[], getEffectiveStatus: Function, todayStr?: string }} params
 */
export function analyzeChitPortfolio({
  chitCommitments = [],
  monthlyIncome = 0,
  commitments = [],
  getEffectiveStatus,
  todayStr = "",
}) {
  const income = Math.max(0, Number(monthlyIncome) || 0);
  let combinedInstallment = 0;
  const roundOverlaps = [];
  const stressMonths = [];

  for (const c of chitCommitments) {
    const meta = c.chitFund || {};
    const V = Math.max(0, Number(meta.chitValue ?? c.amount) || 0);
    const N = Math.max(1, Number(meta.totalMonths) || 12);
    const cur = deriveChitCurrentMonth(meta.startDate || c.startDate, N, todayStr);
    const inst = resolveChitInstallment(V, N, cur, meta.installmentMode, meta.customInstallment);
    combinedInstallment += inst;
  }

  const burdenRatio = income > 0 ? combinedInstallment / income : combinedInstallment > 0 ? 1 : 0;

  if (chitCommitments.length >= 2) {
    roundOverlaps.push({
      count: chitCommitments.length,
      combinedInstallment: Math.round(combinedInstallment),
      note: "Multiple active chits increase monthly installment overlap.",
    });
  }

  const baseline = freeMoneyAfterBurden(commitments, income, getEffectiveStatus);
  let bidRecommendation = "Current liquidity allows planned chit participation.";
  if (burdenRatio > 0.35 || baseline.freeMoney < income * 0.08) {
    bidRecommendation = "Avoid aggressive bidding during projected low-liquidity months.";
    stressMonths.push({ severity: "high", reason: "Combined chit burden strains free cash." });
  } else if (baseline.freeMoney > income * 0.2) {
    bidRecommendation = "Current liquidity allows early bid participation.";
  }

  return {
    chitCount: chitCommitments.length,
    combinedInstallment: Math.round(combinedInstallment),
    burdenRatio: Math.round(burdenRatio * 100),
    roundOverlaps,
    stressMonths,
    bidRecommendation,
    freeCash: Math.round(baseline.freeMoney),
  };
}
