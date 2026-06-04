/** @typedef {import('../types/context.js').AuthProfile} AppSettings */

export const APP_SNAPSHOT_VERSION = 1;

/**
 * Canonical export/sync payload — local-first source of truth shape.
 * @param {{
 *   commitments: unknown[],
 *   lendings: unknown[],
 *   settings: AppSettings,
 *   goals: unknown[],
 *   monthlySnapshots: unknown[],
 *   businessInvoices?: unknown[],
 * }} state
 */
export function buildAppSnapshot(state) {
  return {
    schemaVersion: APP_SNAPSHOT_VERSION,
    exportedAt: new Date().toISOString(),
    commitments: state.commitments ?? [],
    lendings: state.lendings ?? [],
    settings: state.settings ?? {},
    goals: state.goals ?? [],
    monthlySnapshots: state.monthlySnapshots ?? [],
    businessInvoices: state.businessInvoices ?? [],
  };
}

/** @param {unknown} payload */
export function isAppSnapshot(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
  const p = /** @type {Record<string, unknown>} */ (payload);
  if (p.schemaVersion != null || p.exportedAt != null) return true;
  return (
    Array.isArray(p.commitments) ||
    Array.isArray(p.lendings) ||
    (p.settings != null && typeof p.settings === "object")
  );
}
