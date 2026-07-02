/** @param {unknown} payload */
function wealthEntryCount(payload) {
  const p = /** @type {Record<string, unknown>} */ (payload && typeof payload === "object" ? payload : {});
  if (Array.isArray(p.wealthEntries)) return p.wealthEntries.length;
  const wealth = p.wealth;
  if (wealth && typeof wealth === "object" && !Array.isArray(wealth)) {
    const entries = /** @type {{ entries?: unknown[] }} */ (wealth).entries;
    return Array.isArray(entries) ? entries.length : 0;
  }
  return 0;
}

/** @param {unknown} payload */
export function snapshotDataCounts(payload) {
  const p = /** @type {Record<string, unknown>} */ (payload && typeof payload === "object" ? payload : {});
  return {
    bills: Array.isArray(p.commitments) ? p.commitments.length : 0,
    lending: Array.isArray(p.lendings) ? p.lendings.length : 0,
    goals: Array.isArray(p.goals) ? p.goals.length : 0,
    wealth: wealthEntryCount(payload),
  };
}

/** @param {unknown} payload */
export function snapshotHasUserData(payload) {
  const c = snapshotDataCounts(payload);
  return c.bills > 0 || c.lending > 0 || c.goals > 0 || c.wealth > 0;
}

/**
 * @param {{
 *   commitments?: unknown[],
 *   lendings?: unknown[],
 *   goals?: unknown[],
 *   wealth?: { entries?: unknown[] },
 * }} state
 */
export function localStateHasUserData(state) {
  return (
    (state.commitments?.length ?? 0) > 0 ||
    (state.lendings?.length ?? 0) > 0 ||
    (state.goals?.length ?? 0) > 0 ||
    (state.wealth?.entries?.length ?? 0) > 0
  );
}
