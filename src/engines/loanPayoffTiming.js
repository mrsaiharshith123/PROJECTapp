import { addMonths, format } from "date-fns";
import { isBillDueInMonth, normalizeRepeatType } from "../constants/repeatTypes.js";
import { freeMoneyAfterBurden } from "./pressureScore.js";
import { simulatePrepayment } from "./prepayment.js";

const DEBT_CATEGORIES = new Set(["EMI", "Loan", "Credit Card", "BNPL", "Equipment"]);

export function isDebtCommitment(c) {
  return DEBT_CATEGORIES.has(c.category);
}

export function listDebtSources(commitments, lendings, getEffectiveStatus, getEffectiveLendingStatus) {
  const bills = commitments
    .filter((c) => isDebtCommitment(c) && getEffectiveStatus(c) !== "paid")
    .filter((c) => Math.max(0, Number(c.remainingAmount ?? c.amount) || 0) > 0);
  const borrowed = lendings.filter(
    (l) => l.type === "borrowed" && Number(l.remainingAmount) > 0 && getEffectiveLendingStatus(l) !== "complete"
  );
  return { bills, borrowed };
}

function billsDueInMonthExcluding(
  commitments,
  lendings,
  monthKey,
  getEffectiveStatus,
  getEffectiveLendingStatus,
  todayStr,
  exclude
) {
  let total = 0;
  for (const c of commitments) {
    if (exclude?.kind === "commitment" && String(c.id) === String(exclude.id)) continue;
    if (!isBillDueInMonth(c, monthKey, getEffectiveStatus, todayStr)) continue;
    total += Math.max(0, Number(c.remainingAmount ?? c.amount) || 0);
  }
  for (const l of lendings) {
    if (exclude?.kind === "lending" && String(l.id) === String(exclude.id)) continue;
    if (l.type !== "borrowed") continue;
    const due = l.dueDate || l.startDate;
    if (!due?.startsWith(monthKey)) continue;
    if (getEffectiveLendingStatus(l, todayStr) === "complete") continue;
    total += Math.max(0, Number(l.remainingAmount) || 0);
  }
  return total;
}

function targetPaymentDueInMonth(target, monthKey, getEffectiveStatus, todayStr) {
  if (!target) return 0;
  if (target.kind === "commitment") {
    const c = target.raw;
    if (!isBillDueInMonth(c, monthKey, getEffectiveStatus, todayStr)) return 0;
    return Math.max(0, Number(c.remainingAmount ?? c.amount) || 0);
  }
  const l = target.raw;
  const due = l.dueDate || "";
  if (!due.startsWith(monthKey)) return 0;
  return Math.max(0, Number(l.remainingAmount) || 0);
}

function resolveTargetDebt(target) {
  if (!target) return null;
  if (target.kind === "commitment") {
    const c = target.raw;
    return {
      name: c.name,
      balance: Math.max(0, Number(c.remainingAmount ?? c.amount) || 0),
      emi: Math.max(0, Number(c.amount) || 0),
      rate: Number(c.annualInterestRate) || 0,
      startDate: c.startDate || c.dueDate,
    };
  }
  const l = target.raw;
  return {
    name: l.personName || "Loan",
    balance: Math.max(0, Number(l.remainingAmount) || 0),
    emi: Math.max(0, Number(l.monthlyInstallment) || Number(l.totalAmount) / 12 || 0),
    rate: Number(l.interestRate) || 0,
    startDate: l.startDate || l.dueDate,
  };
}

function resolveMonthlyLoanDue(target, monthKey, getEffectiveStatus, todayStr, debt) {
  const emi = Math.max(0, Number(debt?.emi) || 0);
  const calendarDue = target ? targetPaymentDueInMonth(target, monthKey, getEffectiveStatus, todayStr) : 0;

  if (target?.kind === "commitment" && isDebtCommitment(target.raw) && emi > 0) {
    const rt = normalizeRepeatType(target.raw.repeatType);
    if (rt !== "none") return Math.round(emi);
  }

  return Math.round(Math.max(emi, calendarDue));
}

/**
 * Which months are best to pay EXTRA on a loan (light dues) vs stick to minimum (heavy months).
 */
export function adviseLoanExtraPaymentMonths({
  target,
  manualDebt,
  commitments = [],
  lendings = [],
  getEffectiveStatus,
  getEffectiveLendingStatus,
  todayStr,
  monthlyIncome = 0,
  liquidSavings = 0,
  horizonMonths = 12,
}) {
  const debt = manualDebt || resolveTargetDebt(target);
  const income = Math.max(0, Number(monthlyIncome) || 0);
  const baseline = freeMoneyAfterBurden(commitments, income, getEffectiveStatus);
  const exclude = target || null;

  if (!debt || debt.balance <= 0) {
    return {
      rows: [],
      bestForExtra: null,
      lightMonths: [],
      heavyMonths: [],
      suggestedExtra: 0,
      summary: "Enter loan balance and payment amount.",
    };
  }

  const bufferPct = income > 0 ? 0.12 : 0;
  const buffer = income * bufferPct;
  const rows = [];
  const anchor = todayStr ? new Date(todayStr + "T12:00:00") : new Date();

  for (let offset = 0; offset < horizonMonths; offset++) {
    const d = addMonths(anchor, offset);
    const monthKey = format(d, "yyyy-MM");
    const label = format(d, "MMM yyyy");
    const otherBills = billsDueInMonthExcluding(
      commitments,
      lendings,
      monthKey,
      getEffectiveStatus,
      getEffectiveLendingStatus,
      todayStr,
      exclude,
    );
    const loanDue = resolveMonthlyLoanDue(target, monthKey, getEffectiveStatus, todayStr, debt);
    const totalOut = otherBills + loanDue;
    const freeAfter = income - totalOut;
    const roomAfterEmi = income > 0 ? income - otherBills - loanDue - buffer : 0;
    const pressure =
      freeAfter < 0 ? "high" : totalOut > income * 0.85 ? "high" : totalOut > income * 0.6 ? "medium" : "low";

    let interestSaved = 0;
    const extraRoom = Math.max(0, Math.round(roomAfterEmi));
    if (debt.rate > 0 && extraRoom > 0 && debt.balance > 0) {
      const sim = simulatePrepayment({
        principalOutstanding: debt.balance,
        annualRatePercent: debt.rate,
        scheduledEmi: debt.emi || loanDue,
        extraMonthly: extraRoom,
      });
      interestSaved = Math.round(sim?.interestSaved || 0);
    }

    rows.push({
      offset,
      monthKey,
      label,
      otherBills: Math.round(otherBills),
      loanDue: Math.round(loanDue),
      totalOut: Math.round(totalOut),
      freeAfter: Math.round(freeAfter),
      extraCapacity: extraRoom,
      recommendedExtra: 0,
      totalPay: Math.round(loanDue),
      pressure,
      interestSaved,
      goodForExtra: false,
      heavy: pressure === "high" || freeAfter < 0,
    });
  }

  const otherBillAmounts = rows.map((r) => r.otherBills).sort((a, b) => a - b);
  const lightCutoff =
    otherBillAmounts[Math.max(0, Math.floor(otherBillAmounts.length * 0.4))] ?? otherBillAmounts[0] ?? 0;

  for (const row of rows) {
    const room = Math.max(0, Math.round(income - row.otherBills - row.loanDue - buffer));
    const isLightOtherBills = row.otherBills <= lightCutoff;
    row.goodForExtra = isLightOtherBills && room > 500;
    row.recommendedExtra = row.goodForExtra
      ? Math.min(room, Math.round(debt.balance * 0.15))
      : 0;
    row.extraCapacity = room;
    row.totalPay = row.loanDue + row.recommendedExtra;
    if (row.goodForExtra) row.heavy = false;
  }

  const lightMonths = rows.filter((r) => r.goodForExtra);
  const heavyMonths = rows.filter((r) => r.heavy && !r.goodForExtra);
  const byExtra = [...rows].sort((a, b) => b.extraCapacity - a.extraCapacity);
  const bestForExtra = byExtra[0] || null;

  const suggestedExtra = bestForExtra
    ? Math.min(bestForExtra.extraCapacity, Math.round(debt.balance * 0.15))
    : 0;

  let summary = "Add income in Profile for month-by-month guidance.";
  if (income > 0 && debt.emi > 0) {
    summary = `Pay ${formatInr(debt.emi)} EMI every month on ${debt.name}.`;
    if (lightMonths.length) {
      summary += ` Add extra in ${lightMonths
        .slice(0, 3)
        .map((m) => `${m.label} (up to ${formatInr(m.recommendedExtra)})`)
        .join(", ")}.`;
    }
    if (heavyMonths.length) {
      summary += ` Stick to EMI only in ${heavyMonths.slice(0, 2).map((m) => m.label).join(", ")} when pressure is high.`;
    }
  } else if (income > 0 && bestForExtra) {
    if (bestForExtra.goodForExtra) {
      summary = `${bestForExtra.label} is a lighter month (about ${formatInr(bestForExtra.extraCapacity)} available for an additional payment). Other bills ~${formatInr(bestForExtra.otherBills)}.`;
      if (heavyMonths.length) {
        summary += ` Avoid big extras in ${heavyMonths.slice(0, 2).map((m) => m.label).join(", ")} when pressure is high.`;
      }
    } else {
      summary =
        "No low-pressure month in the next year — consider small additional payments only when free cash is positive, or reduce other bills first.";
    }
  }

  return {
    rows,
    bestForExtra,
    lightMonths,
    heavyMonths,
    suggestedExtra,
    summary,
    debt,
    baselineFreeCash: Math.round(baseline.freeMoney),
    baselineBurden: Math.round(baseline.monthlyBurden),
    liquidSavings: Math.round(liquidSavings),
  };
}

function formatInr(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

/**
 * Chart rows for month-by-month bill pressure vs free cash room.
 * @param {ReturnType<typeof adviseLoanExtraPaymentMonths>["rows"]} rows
 */
export function buildLoanTimingChartSeries(rows) {
  if (!rows?.length) return [];
  return rows.map((r) => ({
    name: r.label,
    monthKey: r.monthKey,
    baseline: r.otherBills,
    whatIf: r.freeAfter,
    extraRoom: r.extraCapacity,
    highlight: r.goodForExtra,
    heavy: r.heavy,
  }));
}
