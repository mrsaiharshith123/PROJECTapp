import { emitLocalDataChanged } from "../storage/events.js";
import { STORAGE_KEYS } from "../storage/keys.js";
import { getAssetCategory, getLiabilityCategory } from "../../constants/netWorth/wealthCategories.js";

export const WEALTH_SCHEMA_VERSION = 1;

/** @typedef {import('../../constants/netWorth/wealthCategories.js').LiquidityTier} LiquidityTier */

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
 * @property {string} [maturityDate]
 * @property {number} [emi]
 * @property {string} [profileId]
 * @property {string} [commitmentId] bill-derived rows link back to commitments
 * @property {number} [purchaseYear]
 * @property {number} [purchaseMonth]
 * @property {number} [purchasePrice]
 * @property {number} [purchaseRatePerUnit]
 * @property {boolean} [valueAutoEstimated]
 * @property {number} [marketRatePerSqyd]
 * @property {number} [marketAnnualGrowthPct]
 * @property {number} [valueAiFetchedAt]
 * @property {{ year: number, value: number, ratePerSqyd?: number }[]} [valueHistorySeries]
 * @property {number} [valueHistoryFetchedAt]
 * @property {number} [valueHistoryAlgoVersion]
 * @property {string} [location]
 * @property {number} [latitude]
 * @property {number} [longitude]
 * @property {string} [areaUnit]
 * @property {number} [areaMeasure]
 * @property {number} [weightGrams]
 * @property {number} [purityKarat]
 * @property {string} [vehicleMake]
 * @property {number} [vehicleYear]
 * @property {number} [quantity]
 * @property {number} [buyPrice]
 * @property {string} [exchange]
 * @property {string} [ticker]
 * @property {{ date?: string, type?: string, ratio?: string, amount?: number, applied?: boolean }[]} [corporateActions]
 * @property {number} [lastLivePrice]
 * @property {number} [livePriceFetchedAt]
 * @property {string} [fundSubType]
 * @property {number} [monthlySip]
 * @property {string} [folio]
 * @property {number} [originalLoanAmount]
 * @property {number} [prepaymentPenaltyPct]
 * @property {string} [aiInsight]
 * @property {string} [aiInsightDate]
 * @property {string} [lifeEventTag]
 * @property {number} [ownershipPct] fractional/co-ownership share, 0-100; unset = 100%
 * @property {boolean} [nomineeSet]
 * @property {number} [makingChargesActual]
 * @property {string} [pucExpiryDate]
 * @property {string} [propertyTaxDueDate]
 * @property {{ id: string, pawnDate: string, amount: number, interestRate: number, redemptionDate?: string }[]} [goldLoanCycles]
 * @property {number} createdAt
 * @property {number} updatedAt
 */

/**
 * @typedef {object} WealthSnapshot
 * @property {string} month — yyyy-MM or yyyy-MM-dd for daily rows
 * @property {string} [day]
 * @property {string} [label]
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
 * @property {WealthSnapshot[]} dailySnapshots
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
    dailySnapshots: [],
    milestones: [],
    privacyMode: false,
    savingsStreakMonths: 0,
    lastPositiveSavingsMonth: 0,
  };
}

/** @param {unknown} raw @returns {import('./wealthStorage.js').WealthEntry} */
export function normalizeWealthEntry(raw) {
  const r = /** @type {Record<string, unknown>} */ (raw || {});
  /** @type {'asset' | 'liability'} */
  const kind = r.kind === "liability" ? "liability" : "asset";
  const rawCategoryId = String(r.categoryId || (kind === "asset" ? "other" : "other"));
  const normalizedCategoryId = rawCategoryId === "property" ? "property_residential" : rawCategoryId;
  const cat = kind === "asset" ? getAssetCategory(normalizedCategoryId) : getLiabilityCategory(rawCategoryId);
  const now = Date.now();

  /** @param {unknown} v */
  const optStr = (v) => (v != null && String(v).trim() ? String(v).trim() : undefined);
  /** @param {unknown} v */
  const optNum = (v) => (v != null && v !== "" ? Math.max(0, Number(v) || 0) : undefined);

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
    commitmentId: r.commitmentId ? String(r.commitmentId) : undefined,
    purchaseYear: optNum(r.purchaseYear),
    purchaseMonth:
      r.purchaseMonth != null
        ? Math.min(12, Math.max(1, Math.floor(Number(r.purchaseMonth) || 0)))
        : undefined,
    purchasePrice: optNum(r.purchasePrice),
    purchaseRatePerUnit: optNum(r.purchaseRatePerUnit),
    valueAutoEstimated: Boolean(r.valueAutoEstimated),
    marketRatePerSqyd: optNum(r.marketRatePerSqyd),
    marketAnnualGrowthPct: optNum(r.marketAnnualGrowthPct),
    valueAiFetchedAt: r.valueAiFetchedAt != null ? Number(r.valueAiFetchedAt) || undefined : undefined,
    valueHistorySeries: Array.isArray(r.valueHistorySeries)
      ? r.valueHistorySeries
          .map((p) => {
            const row = /** @type {Record<string, unknown>} */ (p || {});
            const year = Number(row.year);
            const value = Number(row.value);
            if (!year || !value) return null;
            return {
              year,
              value,
              ratePerSqyd: row.ratePerSqyd != null ? Number(row.ratePerSqyd) : undefined,
            };
          })
          .filter(Boolean)
      : undefined,
    valueHistoryFetchedAt:
      r.valueHistoryFetchedAt != null ? Number(r.valueHistoryFetchedAt) || undefined : undefined,
    valueHistoryAlgoVersion:
      r.valueHistoryAlgoVersion != null ? Number(r.valueHistoryAlgoVersion) || undefined : undefined,
    location: optStr(r.location),
    latitude: r.latitude != null ? Number(r.latitude) : undefined,
    longitude: r.longitude != null ? Number(r.longitude) : undefined,
    areaUnit: optStr(r.areaUnit),
    areaMeasure: optNum(r.areaMeasure),
    weightGrams: optNum(r.weightGrams),
    purityKarat: optNum(r.purityKarat),
    vehicleMake: optStr(r.vehicleMake),
    vehicleYear: optNum(r.vehicleYear),
    quantity: optNum(r.quantity),
    buyPrice: optNum(r.buyPrice),
    exchange: optStr(r.exchange),
    ticker: optStr(r.ticker),
    corporateActions: Array.isArray(r.corporateActions)
      ? r.corporateActions
          .map((a) => {
            const row = /** @type {Record<string, unknown>} */ (a || {});
            if (!row.type) return null;
            return {
              date: row.date ? String(row.date) : undefined,
              type: String(row.type),
              ratio: row.ratio ? String(row.ratio) : undefined,
              amount: row.amount != null ? Number(row.amount) || undefined : undefined,
              applied: row.applied === true ? true : undefined,
            };
          })
          .filter(Boolean)
      : undefined,
    lastLivePrice: optNum(r.lastLivePrice),
    livePriceFetchedAt:
      r.livePriceFetchedAt != null ? Number(r.livePriceFetchedAt) || undefined : undefined,
    fundSubType: optStr(r.fundSubType),
    monthlySip: optNum(r.monthlySip),
    folio: optStr(r.folio),
    originalLoanAmount: optNum(r.originalLoanAmount),
    prepaymentPenaltyPct: optNum(r.prepaymentPenaltyPct),
    aiInsight: optStr(r.aiInsight),
    aiInsightDate: optStr(r.aiInsightDate),
    // Major-life-event tagging (e.g. "wedding") for liability entries —
    // see engines/lifeEventDebt.js.
    lifeEventTag: optStr(r.lifeEventTag),
    // Fractional/co-ownership (ancestral or joint-family property) — net
    // worth counts only this share when set (see netWorth/core.js
    // effectiveEntryValue). Unset = 100%, zero behavior change.
    ownershipPct:
      r.ownershipPct != null && !Number.isNaN(Number(r.ownershipPct))
        ? Math.min(100, Math.max(0, Number(r.ownershipPct)))
        : undefined,
    // Succession completeness (engines/successionCompleteness.js) — whether
    // a nominee is registered for this asset. Defaults to false/incomplete
    // when unrecorded, deliberately: an unrecorded nominee is not "assumed fine."
    nomineeSet: r.nomineeSet === true ? true : r.nomineeSet === false ? false : undefined,
    // Gold making-charges recovery analysis (engines/goldIntel.js) — the
    // real recorded making-charge amount, distinct from the flat 15% guess.
    makingChargesActual: optNum(r.makingChargesActual),
    // Document Expiry Radar (engines/documentExpiryRadar.js).
    pucExpiryDate: optStr(r.pucExpiryDate),
    propertyTaxDueDate: optStr(r.propertyTaxDueDate),
    // Gold-as-recurring-credit cycle tracking (engines/goldLoanCycles.js).
    goldLoanCycles: Array.isArray(r.goldLoanCycles)
      ? r.goldLoanCycles
          .map((c) => {
            const row = /** @type {Record<string, unknown>} */ (c || {});
            const amount = Number(row.amount) || 0;
            if (amount <= 0 || !row.pawnDate) return null;
            return {
              id: String(row.id || `${row.pawnDate}-${amount}`),
              pawnDate: String(row.pawnDate).slice(0, 10),
              amount: Math.max(0, amount),
              interestRate: Math.max(0, Number(row.interestRate) || 0),
              redemptionDate: row.redemptionDate ? String(row.redemptionDate).slice(0, 10) : undefined,
            };
          })
          .filter(Boolean)
      : undefined,
    createdAt: Number(r.createdAt) || now,
    updatedAt: Number(r.updatedAt) || now,
  };
}

/** @param {import('./wealthStorage.js').WealthEntry[]} entries */
export function dedupeWealthEntries(entries) {
  const map = new Map();
  for (const entry of entries) {
    map.set(String(entry.id), entry);
  }
  return [...map.values()];
}

/** @param {unknown} raw */
export function normalizeWealthState(raw) {
  if (!raw || typeof raw !== "object") return defaultState();
  const r = /** @type {Record<string, unknown>} */ (raw);
  const entries = Array.isArray(r.entries) ? dedupeWealthEntries(r.entries.map(normalizeWealthEntry)) : [];
  return {
    schemaVersion: WEALTH_SCHEMA_VERSION,
    entries,
    snapshots: Array.isArray(r.snapshots) ? r.snapshots.map((s) => {
      const row = /** @type {Record<string, unknown>} */ (s || {});
      const month = String(row.month || row.day || "");
      return {
        month,
        day: row.day ? String(row.day) : month,
        label: row.label ? String(row.label) : undefined,
        netWorth: Number(row.netWorth) || 0,
        totalAssets: Number(row.totalAssets) || 0,
        totalLiabilities: Number(row.totalLiabilities) || 0,
        liquidNetWorth: Number(row.liquidNetWorth) || 0,
        recordedAt: Number(row.recordedAt) || Date.now(),
      };
    }) : [],
    dailySnapshots: Array.isArray(r.dailySnapshots)
      ? r.dailySnapshots.map((s) => {
          const row = /** @type {Record<string, unknown>} */ (s || {});
          const day = String(row.day || row.month || "");
          return {
            day,
            month: day,
            label: row.label ? String(row.label) : undefined,
            netWorth: Number(row.netWorth) || 0,
            totalAssets: Number(row.totalAssets) || 0,
            totalLiabilities: Number(row.totalLiabilities) || 0,
            liquidNetWorth: Number(row.liquidNetWorth) || 0,
            recordedAt: Number(row.recordedAt) || Date.now(),
          };
        })
      : [],
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

/** @param {string | null} [profileId] null = all profiles */
export function filterWealthByProfile(entries, profileId = "default") {
  if (profileId == null) return entries || [];
  return (entries || []).filter((e) => !e.profileId || e.profileId === profileId);
}
