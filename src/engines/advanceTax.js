import { format, parseISO } from "date-fns";
import { estimateIncomeTax } from "./incomeTaxEstimate.js";

const ADVANCE_THRESHOLDS = 10_000;
const QUARTER_PCTS = [0.15, 0.45, 0.75, 1.0];

/** FY quarter due dates (India): 15 Jun, 15 Sep, 15 Dec, 15 Mar */
function advanceTaxDueDates(fyStartYear) {
  return [
    `${fyStartYear}-06-15`,
    `${fyStartYear}-09-15`,
    `${fyStartYear}-12-15`,
    `${fyStartYear + 1}-03-15`,
  ];
}

function currentFinancialYearStart(todayStr) {
  const y = Number((todayStr || "").slice(0, 4)) || new Date().getFullYear();
  const m = Number((todayStr || "").slice(5, 7)) || 4;
  return m >= 4 ? y : y - 1;
}

/**
 * @param {object} taxInput — passed to estimateIncomeTax
 * @param {string} todayStr
 */
export function computeAdvanceTaxSchedule(taxInput, todayStr = "") {
  const estimate = estimateIncomeTax(taxInput);
  const totalTax = estimate.totalTax || 0;

  if (totalTax < ADVANCE_THRESHOLDS) {
    return {
      required: false,
      totalTax,
      quarters: [],
      message: "Estimated tax is below ₹10,000 — advance tax installments not required.",
    };
  }

  const fyStart = currentFinancialYearStart(todayStr);
  const dueDates = advanceTaxDueDates(fyStart);

  const quarters = QUARTER_PCTS.map((pct, i) => {
    const cumulative = Math.round(totalTax * pct);
    const prev = i === 0 ? 0 : Math.round(totalTax * QUARTER_PCTS[i - 1]);
    return {
      quarter: i + 1,
      dueDate: dueDates[i],
      dueLabel: format(parseISO(`${dueDates[i]}T12:00:00`), "d MMM yyyy"),
      cumulativeTax: cumulative,
      installmentAmount: cumulative - prev,
    };
  });

  return {
    required: true,
    totalTax,
    quarters,
    message: `Estimated liability ₹${totalTax.toLocaleString("en-IN")} — four advance tax installments apply.`,
  };
}

/**
 * Reminder items for notification feed.
 */
export function buildAdvanceTaxReminders(taxInput, todayStr) {
  const schedule = computeAdvanceTaxSchedule(taxInput, todayStr);
  if (!schedule.required) return [];

  const today = todayStr || format(new Date(), "yyyy-MM-dd");
  const items = [];

  for (const q of schedule.quarters) {
    if (q.dueDate < today) continue;
    try {
      const days = Math.ceil(
        (parseISO(`${q.dueDate}T12:00:00`).getTime() - parseISO(`${today}T12:00:00`).getTime()) / 86400000,
      );
      if (days <= 45) {
        items.push({
          id: `advance-tax-q${q.quarter}-${q.dueDate}`,
          name: `Advance tax Q${q.quarter}`,
          dueDate: q.dueDate,
          amount: q.installmentAmount,
          category: "Tax",
          urgency: days <= 7 ? "high" : "normal",
          reason: "advance_tax",
          message: `Advance tax Q${q.quarter} due ${q.dueLabel} — installment ₹${q.installmentAmount.toLocaleString("en-IN")}.`,
        });
      }
    } catch {
      /* ignore */
    }
  }

  return items;
}

/**
 * Synthetic commitment drafts for calendar tracking.
 */
export function advanceTaxCommitmentDrafts(taxInput, todayStr) {
  const schedule = computeAdvanceTaxSchedule(taxInput, todayStr);
  if (!schedule.required) return [];

  return schedule.quarters.map((q) => ({
    name: `Advance tax Q${q.quarter}`,
    amount: q.installmentAmount,
    dueDate: q.dueDate,
    category: "Tax",
    repeatType: "none",
    notes: "Auto-generated from estimated tax liability",
    priority: "critical",
  }));
}
