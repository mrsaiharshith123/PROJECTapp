import { format } from "date-fns";

/**
 * Append or replace today's daily wealth snapshot.
 * @param {import('./wealthStorage.js').WealthState} state
 * @param {ReturnType<import('../../engines/netWorth/core.js').computeNetWorthCore>} core
 */
export function appendDailyWealthSnapshot(state, core) {
  const day = format(new Date(), "yyyy-MM-dd");
  const snap = {
    day,
    month: day,
    label: format(new Date(), "d MMM"),
    netWorth: core.netWorth,
    totalAssets: core.totalAssets,
    totalLiabilities: core.totalLiabilities,
    liquidNetWorth: core.liquidNetWorth,
    recordedAt: Date.now(),
  };
  const dailySnapshots = [...(state.dailySnapshots || []).filter((s) => s.day !== day), snap]
    .sort((a, b) => String(a.day).localeCompare(String(b.day)))
    .slice(-400);
  return { ...state, dailySnapshots };
}
