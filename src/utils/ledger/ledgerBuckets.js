/** Wealth category ids shown under Instruments (not core Assets tab). */
export const INSTRUMENT_WEALTH_IDS = new Set([
  "insurance",
  "sip",
  "fd",
  "rd",
  "pf_epf",
  "stocks",
  "mutual_fund",
]);

/** Commitment categories treated as liabilities in the ledger. */
export const LIABILITY_COMMITMENT_CATEGORIES = new Set([
  "EMI",
  "Loan",
  "Credit Card",
  "BNPL",
  "Home Loan",
  "Car Loan",
  "Personal Loan",
]);

/** Commitment categories treated as instruments. */
export const INSTRUMENT_COMMITMENT_CATEGORIES = new Set(["Insurance", "SIP"]);

export const ASSET_GROUP_PROPERTY = new Set([
  "property_residential",
  "property_land",
  "property_commercial",
  "vehicle",
  "gold",
  "business",
]);

export const ASSET_GROUP_LIQUID = new Set(["bank", "cash", "savings", "emergency"]);

export const ASSET_GROUP_MARKET = new Set(["stocks", "mutual_fund", "crypto", "other"]);

/**
 * @param {import('../../utils/netWorth/wealthStorage.js').WealthEntry} entry
 */
export function isInstrumentWealthEntry(entry) {
  return entry.kind === "asset" && INSTRUMENT_WEALTH_IDS.has(entry.categoryId);
}

/**
 * @param {import('../../utils/netWorth/wealthStorage.js').WealthEntry} entry
 */
export function isCoreAssetEntry(entry) {
  return entry.kind === "asset" && !isInstrumentWealthEntry(entry);
}

/**
 * @param {object} commitment
 */
export function isLiabilityCommitment(commitment) {
  return LIABILITY_COMMITMENT_CATEGORIES.has(commitment?.category);
}

/**
 * @param {object} commitment
 */
export function isInstrumentCommitment(commitment) {
  return INSTRUMENT_COMMITMENT_CATEGORIES.has(commitment?.category);
}

/**
 * @param {import('../../utils/netWorth/wealthStorage.js').WealthEntry[]} entries
 */
export function sumEntryValues(entries) {
  return entries.reduce((s, e) => s + (Number(e.value) || 0), 0);
}

/**
 * @param {import('../../utils/netWorth/wealthStorage.js').WealthEntry[]} entries
 * @param {Set<string>} ids
 */
export function filterWealthByCategories(entries, ids) {
  return entries.filter((e) => ids.has(e.categoryId));
}
