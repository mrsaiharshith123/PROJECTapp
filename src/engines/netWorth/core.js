import { getAssetCategory, liquidityTierWeight } from "../../constants/netWorth/wealthCategories.js";

/** @typedef {import('../../utils/netWorth/wealthStorage.js').WealthEntry} WealthEntry */

/**
 * @param {WealthEntry[]} entries
 * @param {{ includeHidden?: boolean }} [opts]
 */
export function partitionWealth(entries, opts = {}) {
  const visible = opts.includeHidden ? entries : entries.filter((e) => !e.hidden);
  const assets = visible.filter((e) => e.kind === "asset");
  const liabilities = visible.filter((e) => e.kind === "liability");
  return { assets, liabilities };
}

/** @param {WealthEntry[]} assets */
export function sumAssets(assets) {
  return assets.reduce((s, a) => s + (Number(a.value) || 0), 0);
}

/** @param {WealthEntry[]} liabilities */
export function sumLiabilities(liabilities) {
  return liabilities.reduce((s, l) => s + (Number(l.value) || 0), 0);
}

/** @param {WealthEntry[]} assets */
export function sumLiquidAssets(assets) {
  return assets.reduce((s, a) => {
    const tier = getAssetCategory(a.categoryId).tier;
    const weight = liquidityTierWeight(tier);
    return s + (Number(a.value) || 0) * weight;
  }, 0);
}

/** @param {WealthEntry[]} assets */
export function sumByLiquidityTier(assets) {
  /** @type {Record<string, number>} */
  const tiers = { liquid: 0, "semi-liquid": 0, locked: 0, "high-risk": 0 };
  for (const a of assets) {
    const tier = getAssetCategory(a.categoryId).tier;
    tiers[tier] = (tiers[tier] || 0) + (Number(a.value) || 0);
  }
  return tiers;
}

function finiteNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * @param {WealthEntry[]} entries
 */
export function computeNetWorthCore(entries) {
  const { assets, liabilities } = partitionWealth(entries);
  const totalAssets = sumAssets(assets);
  const totalLiabilities = sumLiabilities(liabilities);
  const netWorth = totalAssets - totalLiabilities;
  const liquidNetWorth = sumLiquidAssets(assets) - totalLiabilities;
  const liquidityBreakdown = sumByLiquidityTier(assets);

  const assetAllocation = assets.map((a) => ({
    id: a.id,
    categoryId: a.categoryId,
    name: a.name,
    value: finiteNum(a.value),
    pct: totalAssets > 0 ? finiteNum((a.value / totalAssets) * 100) : 0,
    tier: getAssetCategory(a.categoryId).tier,
  })).sort((a, b) => b.value - a.value);

  const liabilityAllocation = liabilities.map((l) => ({
    id: l.id,
    categoryId: l.categoryId,
    name: l.name,
    value: finiteNum(l.value),
    pct: totalLiabilities > 0 ? finiteNum((l.value / totalLiabilities) * 100) : 0,
    emi: l.emi,
    interestRate: l.interestRate,
  })).sort((a, b) => b.value - a.value);

  return {
    totalAssets: finiteNum(totalAssets),
    totalLiabilities: finiteNum(totalLiabilities),
    netWorth: finiteNum(netWorth),
    liquidNetWorth: finiteNum(liquidNetWorth),
    accessibleSafety: Math.max(0, finiteNum(liquidNetWorth)),
    debtAdjustedPosition: finiteNum(netWorth),
    liquidityBreakdown,
    assetAllocation,
    liabilityAllocation,
    assetCount: assets.length,
    liabilityCount: liabilities.length,
  };
}

/**
 * @param {{ month: string, netWorth: number }[]} snapshots
 */
export function computeGrowthRates(snapshots, currentNetWorth) {
  if (!snapshots.length) {
    return { monthlyPct: null, yearlyPct: null, velocity: 0, trend: [] };
  }
  const sorted = [...snapshots].sort((a, b) => a.month.localeCompare(b.month));
  const trend = sorted.map((s) => ({ month: s.month, value: s.netWorth }));
  const last = sorted[sorted.length - 1];
  const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;
  const yearAgo = sorted.find((s) => {
    const [y, m] = s.month.split("-").map(Number);
    const [cy] = last.month.split("-").map(Number);
    return y === cy - 1 && m === Number(last.month.split("-")[1]);
  });

  const monthlyPct =
    prev && prev.netWorth !== 0
      ? ((currentNetWorth - prev.netWorth) / Math.abs(prev.netWorth)) * 100
      : null;
  const yearlyPct =
    yearAgo && yearAgo.netWorth !== 0
      ? ((currentNetWorth - yearAgo.netWorth) / Math.abs(yearAgo.netWorth)) * 100
      : null;

  const velocity =
    sorted.length >= 2
      ? (sorted[sorted.length - 1].netWorth - sorted[0].netWorth) / sorted.length
      : 0;

  return { monthlyPct, yearlyPct, velocity, trend };
}
