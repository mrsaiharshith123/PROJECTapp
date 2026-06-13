/**
 * Human-facing score bands — engines stay numeric; UI leads with words.
 */

/** @param {string} band */
export function billHealthBandKey(band) {
  return `scores.billHealth.band.${band || "watch"}`;
}

/**
 * @param {{ band: string, stressCount?: number, watchCount?: number }} portfolio
 */
export function billHealthSummaryKey(portfolio) {
  if (portfolio.band === "good") return "scores.billHealth.summary.good";
  if ((portfolio.stressCount || 0) > 0) return "scores.billHealth.summary.stress";
  return "scores.billHealth.summary.watch";
}
