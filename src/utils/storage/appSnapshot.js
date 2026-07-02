/** @typedef {import('../../types/context.js').AuthProfile} AppSettings */

import { normalizeWealthState } from "../netWorth/wealthStorage.js";

export const APP_SNAPSHOT_VERSION = 3;

/**
 * Canonical export/sync payload — local-first source of truth shape.
 * @param {{
 *   commitments: unknown[],
 *   lendings: unknown[],
 *   settings: AppSettings,
 *   goals: unknown[],
 *   monthlySnapshots: unknown[],
 *   wealth?: import('../netWorth/wealthStorage.js').WealthState,
 * }} state
 */
export function buildAppSnapshot(state) {
  const wealth = normalizeWealthState(state.wealth ?? { entries: [] });
  const settings = sanitizeSettingsForCloud(state.settings ?? {});
  return {
    schemaVersion: APP_SNAPSHOT_VERSION,
    exportedAt: new Date().toISOString(),
    commitments: state.commitments ?? [],
    lendings: state.lendings ?? [],
    settings,
    goals: state.goals ?? [],
    monthlySnapshots: state.monthlySnapshots ?? [],
    wealth,
  };
}

const CLOUD_STRIP_SETTINGS_KEYS = new Set([
  "profileImageDataUrl",
  "pan",
  "panNumber",
  "aadhaar",
  "aadhaarLast4",
  "legalName",
  "dateOfBirth",
  "phone",
  "phoneNumber",
  "email",
  "displayName",
]);

/** @param {Record<string, unknown>} raw */
function sanitizeSettingsForCloud(raw) {
  const out = { ...raw };
  for (const key of CLOUD_STRIP_SETTINGS_KEYS) {
    delete out[key];
  }
  return out;
}

/** @param {unknown} payload */
export function isAppSnapshot(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
  const p = /** @type {Record<string, unknown>} */ (payload);
  if (p.schemaVersion != null || p.exportedAt != null) return true;
  return (
    Array.isArray(p.commitments) ||
    Array.isArray(p.lendings) ||
    (p.wealth != null && typeof p.wealth === "object") ||
    Array.isArray(p.wealthEntries) ||
    (p.settings != null && typeof p.settings === "object")
  );
}
