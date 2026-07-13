/**
 * "4 of 7 assets have a registered nominee." Uses the optional
 * `nomineeSet` boolean field on wealth entries (defaults false when unset,
 * which is the honest, cautious default — an unrecorded nominee should read
 * as incomplete, not silently pass).
 * @param {import('../utils/netWorth/wealthStorage.js').WealthEntry[]} entries
 */
export function computeSuccessionCompleteness(entries) {
  // Only asset categories where a nominee is a meaningful real-world concept —
  // a cash-in-hand entry has no nominee mechanism, for instance.
  const NOMINEE_RELEVANT = new Set([
    "bank",
    "savings",
    "fd",
    "rd",
    "sip",
    "mutual_fund",
    "stocks",
    "pf_epf",
    "insurance",
    "property_residential",
    "property_land",
    "property_commercial",
  ]);

  const relevant = (entries || []).filter((e) => e.kind === "asset" && !e.hidden && NOMINEE_RELEVANT.has(e.categoryId));
  const withNominee = relevant.filter((e) => e.nomineeSet === true);
  const missing = relevant.filter((e) => e.nomineeSet !== true);

  const total = relevant.length;
  const completed = withNominee.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : null;

  return {
    total,
    completed,
    missing: missing.map((e) => ({ id: e.id, name: e.name, categoryId: e.categoryId })),
    pct,
    hasData: total > 0,
  };
}
