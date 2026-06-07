import { addMonths, format } from "date-fns";
import { isBillDueInMonth } from "../constants/repeatTypes.js";
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
      exclude
    );
    const loanDue = target
      ? targetPaymentDueInMonth(target, monthKey, getEffectiveStatus, todayStr)
      : debt.emi;
    const totalOut = otherBills + loanDue;
    const freeAfter = income - totalOut;
    const buffer = income * bufferPct;
    const extraCapacity = Math.max(0, Math.round(freeAfter - buffer));
    const pressure =
      freeAfter < 0 ? "high" : totalOut > income * 0.85 ? "high" : totalOut > income * 0.6 ? "medium" : "low";

    let interestSaved = 0;
    if (debt.rate > 0 && extraCapacity > 0 && debt.balance > 0) {
      const sim = simulatePrepayment({
        principalOutstanding: debt.balance,
        annualRatePercent: debt.rate,
        scheduledEmi: debt.emi || loanDue,
        extraMonthly: extraCapacity,
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
      extraCapacity,
      pressure,
      interestSaved,
      goodForExtra: pressure === "low" && extraCapacity > 500,
      heavy: pressure === "high" || freeAfter < 0,
    });
  }

  const lightMonths = rows.filter((r) => r.goodForExtra);
  const heavyMonths = rows.filter((r) => r.heavy);
  const byExtra = [...rows].sort((a, b) => b.extraCapacity - a.extraCapacity);
  const bestForExtra = byExtra[0] || null;

  const suggestedExtra = bestForExtra
    ? Math.min(bestForExtra.extraCapacity, Math.round(debt.balance * 0.15))
    : 0;

  let summary = "Add income in Profile for month-by-month guidance.";
  if (income > 0 && bestForExtra) {
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
