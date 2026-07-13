import { safeScore } from "../_guard.js";

/**
 * Herfindahl-style concentration score — a single 0-100 number ("100 = maximally
 * diversified") plus the single largest concentration to explain it in plain
 * English ("73% of your net worth is in one property").
 * @param {import('../../utils/netWorth/wealthStorage.js').WealthEntry[]} assets
 */
export function computeDiversificationScore(assets) {
  const visible = (assets || []).filter((a) => !a.hidden && Number(a.value) > 0);
  const total = visible.reduce((s, a) => s + Math.max(0, Number(a.value) || 0), 0);

  if (total <= 0 || visible.length === 0) {
    return { score: 0, total: 0, topConcentration: null, byCategory: [], hasData: false };
  }

  // Herfindahl-Hirschman Index on individual entries (not categories) — a
  // single dominant asset should tank the score even if it's technically
  // one of several "property" rows.
  const shares = visible.map((a) => Math.max(0, Number(a.value) || 0) / total);
  const hhi = shares.reduce((s, share) => s + share * share, 0); // 1/n (perfectly even) .. 1 (single asset)
  const n = visible.length;
  // Normalize so evenly-split-across-n scores ~100 regardless of n, and a
  // single asset scores 0, using the normalized HHI formula.
  const normalizedHhi = n > 1 ? (hhi - 1 / n) / (1 - 1 / n) : 1;
  const score = safeScore(100 - normalizedHhi * 100);

  const sortedByValue = [...visible].sort((a, b) => Number(b.value) - Number(a.value));
  const top = sortedByValue[0];
  const topConcentration = {
    id: top.id,
    name: top.name,
    categoryId: top.categoryId,
    value: Math.max(0, Number(top.value) || 0),
    pct: Math.round((Math.max(0, Number(top.value) || 0) / total) * 100),
  };

  /** @type {Map<string, number>} */
  const byCategoryMap = new Map();
  for (const a of visible) {
    const v = Math.max(0, Number(a.value) || 0);
    byCategoryMap.set(a.categoryId, (byCategoryMap.get(a.categoryId) || 0) + v);
  }
  const byCategory = [...byCategoryMap.entries()]
    .map(([categoryId, value]) => ({ categoryId, value, pct: Math.round((value / total) * 100) }))
    .sort((a, b) => b.value - a.value);

  /** @type {'concentrated' | 'moderate' | 'diversified'} */
  let band;
  if (score < 35) band = "concentrated";
  else if (score < 65) band = "moderate";
  else band = "diversified";

  return {
    score,
    band,
    total,
    topConcentration,
    byCategory,
    hasData: true,
    insightKeys:
      topConcentration.pct >= 50
        ? [{ key: "netWorth.insight.concentrationHigh", params: { pct: topConcentration.pct, name: topConcentration.name } }]
        : [],
  };
}
