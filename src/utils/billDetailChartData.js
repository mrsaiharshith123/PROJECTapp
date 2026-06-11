import { commitmentSeriesKey } from "./billLifecycle.js";
import { totalPaidOnPayments } from "./commitmentPayments.js";

function seriesPayments(c, allCommitments) {
  if (!Array.isArray(allCommitments) || allCommitments.length === 0) {
    return c.payments || [];
  }
  const key = commitmentSeriesKey(c);
  return allCommitments
    .filter((x) => commitmentSeriesKey(x) === key)
    .flatMap((x) => x.payments || []);
}

/**
 * Rupee split for pie / donut / bar / line (two-point + timeline).
 * @param {ReturnType<import('./commitmentSpendSummary.js').computeBillSpendSummary>} summary
 * @param {(key: string) => string} t
 */
export function buildBillBreakdownChartData(summary, t) {
  const paid = Math.max(0, Math.round(summary.paidTillNow ?? summary.spentSinceStart ?? 0));
  const remaining = Math.max(0, Math.round(summary.remainingToPay ?? 0));
  const rows = [
    { name: t("charts.paid"), value: paid },
    { name: t("bill.detail.stillToPay"), value: remaining },
  ];
  return rows.filter((r) => r.value > 0);
}

/**
 * Cumulative paid over time from recorded payments.
 * @param {object} bill
 * @param {object[]} allCommitments
 */
export function buildBillTimelineChartData(bill, allCommitments) {
  const pays = [...seriesPayments(bill, allCommitments)]
    .filter((p) => p.date && Number(p.amount) > 0)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  let running = 0;
  return pays.map((p) => {
    running += Math.max(0, Number(p.amount) || 0);
    const d = new Date(`${p.date}T12:00:00`);
    const name = Number.isNaN(d.getTime())
      ? p.date
      : d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
    return { name, value: Math.round(running) };
  });
}

/**
 * @param {object} bill
 * @param {object[]} allCommitments
 */
export function buildBillPaymentList(bill, allCommitments) {
  return [...seriesPayments(bill, allCommitments)]
    .map((p, index) => ({
      index,
      date: p.date || "",
      amount: Math.max(0, Number(p.amount) || 0),
    }))
    .filter((p) => p.amount > 0 && p.date)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

/** @param {object} bill @param {object[]} allCommitments */
export function billHasChartData(bill, allCommitments, summary) {
  const paid = summary.paidTillNow ?? totalPaidOnPayments(seriesPayments(bill, allCommitments));
  const remaining = summary.remainingToPay ?? 0;
  return paid > 0 || remaining > 0 || buildBillTimelineChartData(bill, allCommitments).length > 0;
}
