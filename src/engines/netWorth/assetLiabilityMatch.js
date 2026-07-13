import Decimal from "decimal.js";

/** Liability categories with a natural appreciating-asset counterpart. */
const BACKED_LIABILITY_CATEGORIES = new Set(["home_loan", "vehicle_loan", "business_debt"]);
const BACKING_ASSET_CATEGORIES = {
  home_loan: new Set(["property_residential", "property_land", "property_commercial"]),
  vehicle_loan: new Set(["vehicle"]),
  business_debt: new Set(["business"]),
};

/**
 * For each liability, find whether a matching asset category exists in the
 * portfolio and estimate coverage — debt backed by an appreciating asset is
 * fundamentally different from unbacked (pure-consumption) debt, even at
 * the same balance.
 * @param {import('../../utils/netWorth/wealthStorage.js').WealthEntry[]} assets
 * @param {import('../../utils/netWorth/wealthStorage.js').WealthEntry[]} liabilities
 */
export function computeAssetLiabilityMatch(assets, liabilities) {
  const visibleAssets = (assets || []).filter((a) => !a.hidden);
  const visibleLiabilities = (liabilities || []).filter((l) => !l.hidden);

  const assetTotalsByCategory = new Map();
  for (const a of visibleAssets) {
    const value = Math.max(0, Number(a.value) || 0);
    assetTotalsByCategory.set(a.categoryId, (assetTotalsByCategory.get(a.categoryId) || new Decimal(0)).plus(value));
  }

  let backedDebt = new Decimal(0);
  let unbackedDebt = new Decimal(0);
  const rows = visibleLiabilities.map((l) => {
    const balance = Math.max(0, Number(l.value) || 0);
    const backingSet = BACKING_ASSET_CATEGORIES[l.categoryId];
    const isBackable = BACKED_LIABILITY_CATEGORIES.has(l.categoryId);
    let matchedAssetValue = 0;
    if (isBackable && backingSet) {
      for (const catId of backingSet) {
        const total = assetTotalsByCategory.get(catId);
        if (total) matchedAssetValue += total.toNumber();
      }
    }
    const hasMatch = isBackable && matchedAssetValue > 0;
    if (hasMatch) backedDebt = backedDebt.plus(balance);
    else unbackedDebt = unbackedDebt.plus(balance);

    const coverageRatio = hasMatch && balance > 0 ? matchedAssetValue / balance : hasMatch ? 1 : 0;

    return {
      id: l.id,
      name: l.name,
      categoryId: l.categoryId,
      balance,
      backed: hasMatch,
      matchedAssetValue,
      coverageRatio: Math.round(coverageRatio * 100) / 100,
    };
  });

  const totalDebt = backedDebt.plus(unbackedDebt);
  const backedPct = totalDebt.gt(0) ? backedDebt.div(totalDebt).times(100).toNumber() : 0;

  return {
    rows: rows.sort((a, b) => (a.backed === b.backed ? b.balance - a.balance : a.backed ? 1 : -1)),
    totalDebt: totalDebt.toNumber(),
    backedDebt: backedDebt.toNumber(),
    unbackedDebt: unbackedDebt.toNumber(),
    backedDebtPct: Math.round(backedPct),
    // Unbacked debt is what to attack first — it has no offsetting asset.
    payoffPriorityIds: rows
      .filter((r) => !r.backed)
      .sort((a, b) => b.balance - a.balance)
      .map((r) => r.id),
  };
}
