/**
 * Pick a stable ₹/sqyd from AI market payload.
 * Prefers range midpoint, cross-checks govt guideline (≈2–3×), dampens jumps vs stored/locality.
 *
 * @param {object} marketData
 * @param {{ storedRate?: number, localityRate?: number }} [opts]
 * @returns {number | null}
 */
export function stabilizePropertyMarketRate(marketData, opts = {}) {
  const rateObj = marketData?.marketRate || {};
  const govt = Number(marketData?.governmentRate?.perSqyd) || 0;
  const stored = Number(opts.storedRate) || 0;
  const locality = Number(opts.localityRate) || 0;

  let perSqyd = rateObj.perSqyd != null ? Number(rateObj.perSqyd) : 0;
  const perSqft = rateObj.perSqft != null ? Number(rateObj.perSqft) : 0;
  if ((!perSqyd || Number.isNaN(perSqyd)) && perSqft > 0) perSqyd = perSqft * 9;

  const rMin = Number(rateObj.rangeMin) || 0;
  const rMax = Number(rateObj.rangeMax) || 0;

  /** @type {number[]} */
  const candidates = [];
  if (rMin > 0 && rMax >= rMin) candidates.push((rMin + rMax) / 2);
  if (perSqyd > 0 && !Number.isNaN(perSqyd)) candidates.push(perSqyd);
  if (govt > 0) {
    candidates.push(govt * 2, govt * 2.5, govt * 3);
  }

  let chosen = perSqyd > 0 ? perSqyd : 0;
  if (candidates.length) {
    if (govt > 0) {
      const target = govt * 2.5;
      chosen = candidates.reduce((best, c) =>
        Math.abs(c - target) < Math.abs(best - target) ? c : best,
      );
    } else {
      const sorted = [...candidates].sort((a, b) => a - b);
      chosen = sorted[Math.floor(sorted.length / 2)];
    }
  }

  const anchorRaw = locality > 0 ? locality : stored > 0 ? stored : 0;
  let anchor = anchorRaw;
  if (anchor > 0 && govt > 0 && anchor < govt * 1.2) {
    anchor = 0;
  }
  if (anchor > 200_000) {
    anchor = 0;
  }
  if (anchor > 0 && chosen > 0) {
    const delta = Math.abs(chosen - anchor) / anchor;
    if (delta > 0.15) {
      chosen = anchor;
    } else if (delta > 0.04) {
      chosen = Math.round(anchor * 0.8 + chosen * 0.2);
    } else {
      chosen = anchor;
    }
  }

  chosen = Math.round(Math.max(500, Math.min(500_000, chosen)));
  return chosen > 0 ? chosen : null;
}

/**
 * @param {object} marketData
 * @param {number} perSqyd
 * @param {number} area
 * @param {number} [currentValue]
 */
export function applyStabilizedMarketRate(marketData, perSqyd, area, currentValue = 0) {
  if (!marketData || !perSqyd) return marketData;
  const md = {
    ...marketData,
    marketRate: { ...(marketData.marketRate || {}), perSqyd },
  };
  if (area > 0) {
    md.impliedMarketValue = Math.round(perSqyd * area);
  }
  if (currentValue > 0 && md.impliedMarketValue != null) {
    md.valuationGap = Number(md.impliedMarketValue) - currentValue;
  }
  if (md.marketRate?.perSqft) {
    md.marketRate.perSqft = Math.round(perSqyd / 9);
  }
  return md;
}
