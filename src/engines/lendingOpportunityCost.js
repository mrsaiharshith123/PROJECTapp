import Decimal from "decimal.js";

const DEFAULT_FD_RATE_PCT = 7;

/**
 * "You lent 2L interest-free for 8 months — in an FD at 7%, that's 9,300."
 * Framed as context, not a judgment against lending.
 * @param {object[]} lendings
 * @param {number} [assumedFdRatePct]
 * @param {string} [todayStr]
 */
export function computeLendingOpportunityCost(lendings, assumedFdRatePct = DEFAULT_FD_RATE_PCT, todayStr) {
  const today = todayStr ? new Date(`${todayStr}T12:00:00`) : new Date();
  const rows = (lendings || [])
    .filter((l) => l.type === "lent")
    .map((l) => {
      const principal = Math.max(0, Number(l.principalAmount ?? l.totalAmount) || 0);
      const rate = Math.max(0, Number(l.interestRate) || 0);
      if (rate > 0 || principal <= 0) return null; // only interest-free loans have an opportunity cost worth flagging
      const start = l.startDate ? new Date(`${String(l.startDate).slice(0, 10)}T12:00:00`) : null;
      if (!start || Number.isNaN(start.getTime())) return null;
      const monthsElapsed = Math.max(
        0,
        (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth()),
      );
      if (monthsElapsed <= 0) return null;
      const foregoneInterest = new Decimal(principal)
        .times(assumedFdRatePct)
        .div(100)
        .times(monthsElapsed)
        .div(12)
        .toNumber();
      return {
        id: l.id,
        personName: l.personName,
        principal,
        monthsElapsed,
        foregoneInterest: Math.round(foregoneInterest),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.foregoneInterest - a.foregoneInterest);

  const totalForegone = rows.reduce((s, r) => s + r.foregoneInterest, 0);

  return { rows, totalForegone, assumedFdRatePct };
}
