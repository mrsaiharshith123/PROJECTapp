import { emitLocalDataChanged } from "../../storage/events.js";
import { STORAGE_KEYS } from "../../storage/keys.js";
import { getAssetCategory, getLiabilityCategory } from "../../constants/netWorth/categories.js";

export const WEALTH_SCHEMA_VERSION = 1;

/** @typedef {import('../../constants/netWorth/categories.js').LiquidityTier} LiquidityTier */

/**
 * @typedef {object} WealthEntry
 * @property {string} id
 * @property {'asset' | 'liability'} kind
 * @property {string} categoryId
 * @property {string} name
 * @property {number} value
 * @property {string} [notes]
 * @property {string[]} [tags]
 * @property {boolean} [hidden]
 * @property {string} [currency]
 * @property {number} [interestRate]
 * @property {number} [emi]
 * @property {string} [profileId]
 * @property {number} createdAt
 * @property {number} updatedAt
 */

/**
 * @typedef {object} WealthSnapshot
 * @property {string} month
 * @property {number} netWorth
 * @property {number} totalAssets
 * @property {number} totalLiabilities
 * @property {number} liquidNetWorth
 * @property {number} recordedAt
 */

/**
 * @typedef {object} WealthMilestone
 * @property {string} id
 * @property {string} type
 * @property {string} labelKey
 * @property {number} achievedAt
 * @property {number} [value]
 */

/**
 * @typedef {object} WealthState
 * @property {number} schemaVersion
 * @property {WealthEntry[]} entries
 * @property {WealthSnapshot[]} snapshots
 * @property {WealthMilestone[]} milestones
 * @property {boolean} privacyMode
 * @property {number} savingsStreakMonths
 * @property {number} lastPositiveSavingsMonth
 */

function defaultState() {
  return {
    schemaVersion: WEALTH_SCHEMA_VERSION,
    entries: [],
    snapshots: [],
    milestones: [],
    privacyMode: false,
    savingsStreakMonths: 0,
    lastPositiveSavingsMonth: 0,
  };
}

/** @param {unknown} raw */
export function normalizeWealthEntry(raw) {
  const r = /** @type {Record<string, unknown>} */ (raw || {});
  const kind = r.kind === "liability" ? "liability" : "asset";
  const categoryId = String(r.categoryId || (kind === "asset" ? "other" : "other"));
  const cat = kind === "asset" ? getAssetCategory(categoryId) : getLiabilityCategory(categoryId);
  const now = Date.now();
  return {
    id: String(r.id || now),
    kind,
    categoryId: cat.id,
    name: String(r.name || "").trim() || "Untitled",
    value: Math.max(0, Number(r.value) || 0),
    notes: r.notes ? String(r.notes) : "",
    tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
    hidden: Boolean(r.hidden),
    currency: r.currency ? String(r.currency) : "INR",
    interestRate: r.interestRate != null ? Math.max(0, Number(r.interestRate) || 0) : undefined,
    emi: r.emi != null ? Math.max(0, Number(r.emi) || 0) : undefined,
    profileId: r.profileId ? String(r.profileId) : "default",
    createdAt: Number(r.createdAt) || now,
    updatedAt: Number(r.updatedAt) || now,
  };
}

/** @param {unknown} raw */
export function normalizeWealthState(raw) {
  if (!raw || typeof raw !== "object") return defaultState();
  const r = /** @type {Record<string, unknown>} */ (raw);
  return {
    schemaVersion: WEALTH_SCHEMA_VERSION,
    entries: Array.isArray(r.entries) ? r.entries.map(normalizeWealthEntry) : [],
    snapshots: Array.isArray(r.snapshots) ? r.snapshots.map((s) => {
      const row = /** @type {Record<string, unknown>} */ (s || {});
      return {
        month: String(row.month || ""),
        netWorth: Number(row.netWorth) || 0,
        totalAssets: Number(row.totalAssets) || 0,
        totalLiabilities: Number(row.totalLiabilities) || 0,
        liquidNetWorth: Number(row.liquidNetWorth) || 0,
        recordedAt: Number(row.recordedAt) || Date.now(),
      };
    }) : [],
    milestones: Array.isArray(r.milestones) ? r.milestones : [],
    privacyMode: Boolean(r.privacyMode),
    savingsStreakMonths: Math.max(0, Number(r.savingsStreakMonths) || 0),
    lastPositiveSavingsMonth: Number(r.lastPositiveSavingsMonth) || 0,
  };
}

let cache = null;

export function invalidateWealthCache() {
  cache = null;
}

export function loadWealthState() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.wealth);
    cache = raw ? normalizeWealthState(JSON.parse(raw)) : defaultState();
  } catch {
    cache = defaultState();
  }
  return cache;
}

/** @param {WealthState} state */
export function saveWealthState(state) {
  const normalized = normalizeWealthState(state);
  try {
    localStorage.setItem(STORAGE_KEYS.wealth, JSON.stringify(normalized));
    invalidateWealthCache();
    emitLocalDataChanged();
  } catch {
    /* ignore */
  }
  cache = normalized;
  return normalized;
}

/** @param {string} [profileId] */
export function filterWealthByProfile(entries, profileId = "default") {
  return entries.filter((e) => !e.profileId || e.profileId === profileId);
}
