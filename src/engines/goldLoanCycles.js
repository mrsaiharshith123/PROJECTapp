import Decimal from "decimal.js";

/**
 * @typedef {object} GoldLoanCycle
 * @property {string} id
 * @property {string} pawnDate
 * @property {number} amount principal borrowed against the gold
 * @property {number} interestRate annual %
 * @property {string} [redemptionDate] unset while still pawned
 */

/**
 * Gold-as-recurring-credit is real and invisible: family gold pawned and
 * redeemed repeatedly during medical bills, weddings, bad months. Nobody
 * tallies the cumulative interest paid across cycles because each cycle
 * feels like a one-off. This makes the lifetime cost visible.
 * @param {GoldLoanCycle[]} cycles
 * @param {string} [todayStr]
 */
export function analyzeGoldLoanCycles(cycles, todayStr) {
  const today = todayStr ? new Date(`${todayStr}T12:00:00`) : new Date();
  const list = Array.isArray(cycles) ? cycles : [];

  let totalInterestPaid = new Decimal(0);
  let currentlyPawnedAmount = new Decimal(0);
  const rows = list
    .map((c) => {
      const amount = Math.max(0, Number(c.amount) || 0);
      const rate = Math.max(0, Number(c.interestRate) || 0);
      if (amount <= 0) return null;
      const pawnDate = c.pawnDate ? new Date(`${String(c.pawnDate).slice(0, 10)}T12:00:00`) : null;
      if (!pawnDate || Number.isNaN(pawnDate.getTime())) return null;

      const redemptionDate = c.redemptionDate ? new Date(`${String(c.redemptionDate).slice(0, 10)}T12:00:00`) : null;
      const isActive = !redemptionDate;
      const endDate = redemptionDate || today;
      const monthsHeld = Math.max(
        0,
        (endDate.getFullYear() - pawnDate.getFullYear()) * 12 + (endDate.getMonth() - pawnDate.getMonth()),
      );
      const interest = new Decimal(amount).times(rate).div(100).times(monthsHeld).div(12);

      totalInterestPaid = totalInterestPaid.plus(interest);
      if (isActive) currentlyPawnedAmount = currentlyPawnedAmount.plus(amount);

      return {
        id: c.id,
        pawnDate: c.pawnDate,
        redemptionDate: c.redemptionDate || null,
        amount,
        interestRate: rate,
        monthsHeld,
        interestForCycle: Math.round(interest.toNumber()),
        isActive,
      };
    })
    .filter(Boolean)
    .sort((a, b) => String(b.pawnDate).localeCompare(String(a.pawnDate)));

  const cycleCount = rows.length;
  const repeatCycleCount = list.length; // cycles are inherently repeat-borrowing once count > 1

  return {
    cycles: rows,
    cycleCount,
    isRepeatCredit: repeatCycleCount >= 2,
    totalInterestPaid: Math.round(totalInterestPaid.toNumber()),
    currentlyPawnedAmount: currentlyPawnedAmount.toNumber(),
    hasActivePawns: currentlyPawnedAmount.gt(0),
  };
}
