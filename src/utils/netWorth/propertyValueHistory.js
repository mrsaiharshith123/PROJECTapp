/** Bump when milestone expansion logic changes — triggers re-fetch on detail open. */
export const VALUE_HISTORY_ALGO_VERSION = 2;

/**
 * Sanitize AI milestones — sometimes returns total plot value in ratePerSqyd.
 * @param {{ year: number, ratePerSqyd?: number, value?: number }[]} milestones
 * @param {number} area
 * @param {string} [areaUnit]
 */
export function sanitizeMilestoneRates(milestones, area, areaUnit = "sqyd") {
  if (!Array.isArray(milestones) || !milestones.length) return [];

  const sqydArea = areaUnit === "sqft" && area > 0 ? area / 9 : area;

  return milestones
    .map((m) => {
      const year = Number(m.year);
      let rate = Number(m.ratePerSqyd);
      const totalValue = m.value != null ? Number(m.value) : null;

      if (totalValue > 0 && (!rate || rate <= 0 || Number.isNaN(rate))) {
        rate = sqydArea > 0 ? totalValue / sqydArea : totalValue;
      } else if (totalValue > 0 && sqydArea > 0 && rate > 0) {
        const asTotal = rate * sqydArea;
        if (Math.abs(asTotal - totalValue) / totalValue > 0.35) {
          const asRate = totalValue / sqydArea;
          if (asRate > 50 && asRate < 500_000) rate = asRate;
        }
      }

      // Total property value mistaken as per-sqyd rate (e.g. ₹33L stored as rate on 215 sqyd plot).
      if (rate > 0 && sqydArea > 0 && rate > 200_000) {
        const corrected = rate / sqydArea;
        if (corrected > 100 && corrected < 200_000) rate = corrected;
      }

      // Per-sqft returned as per-sqyd (common AI mistake).
      if (rate > 0 && rate < 8_000 && areaUnit !== "sqft") {
        const asSqyd = rate * 9;
        if (asSqyd > 5_000 && asSqyd < 200_000) rate = asSqyd;
      }

      return { year, ratePerSqyd: rate };
    })
    .filter((m) => m.year && m.ratePerSqyd > 0 && !Number.isNaN(m.ratePerSqyd));
}

/**
 * Expand locality ₹/sqyd milestones into a plot-specific yearly value series.
 * Same locality curve × each plot's area and purchase/current anchors.
 *
 * @param {{ year: number, ratePerSqyd: number }[]} milestones
 * @param {number} area
 * @param {number} purchaseYear
 * @param {number} currentYear
 * @param {number} [purchasePrice]
 * @param {{ purchaseRatePerUnit?: number, currentRate?: number, areaUnit?: string }} [opts]
 */
export function expandMilestonesToSeries(
  milestones,
  area,
  purchaseYear,
  currentYear,
  purchasePrice = 0,
  opts = {},
) {
  if (!milestones?.length || !area || area <= 0 || !purchaseYear || currentYear < purchaseYear) {
    return [];
  }

  const areaUnit = opts.areaUnit || "sqyd";
  const sqydArea = areaUnit === "sqft" ? area / 9 : area;
  if (sqydArea <= 0) return [];

  const sorted = sanitizeMilestoneRates(milestones, sqydArea, "sqyd").sort((a, b) => a.year - b.year);
  if (!sorted.length) return [];

  const purchaseRatePerUnit = Number(opts.purchaseRatePerUnit) || 0;
  const currentRate = Number(opts.currentRate) || 0;

  const purchaseRate =
    purchaseRatePerUnit > 0
      ? purchaseRatePerUnit
      : purchasePrice > 0
        ? purchasePrice / sqydArea
        : interpolateRateAtYear(sorted, purchaseYear);

  const endRate =
    currentRate > 0 ? currentRate : interpolateRateAtYear(sorted, currentYear);

  const localAtPurchase = interpolateRateAtYear(sorted, purchaseYear);
  const localAtCurrent = interpolateRateAtYear(sorted, currentYear);
  const localSpan = localAtCurrent - localAtPurchase;
  const yearSpan = currentYear - purchaseYear || 1;

  const useAnchoredShape =
    endRate > 0 && purchaseRate > 0 && (purchasePrice > 0 || purchaseRatePerUnit > 0 || currentRate > 0);

  /** @type {{ year: number, value: number, ratePerSqyd: number }[]} */
  const series = [];
  for (let y = purchaseYear; y <= currentYear; y++) {
    let rate;
    if (useAnchoredShape) {
      if (Math.abs(localSpan) < 1) {
        const t = (y - purchaseYear) / yearSpan;
        rate = purchaseRate + (endRate - purchaseRate) * t;
      } else {
        const localY = interpolateRateAtYear(sorted, y);
        const shape = (localY - localAtPurchase) / localSpan;
        rate = purchaseRate + (endRate - purchaseRate) * shape;
      }
    } else {
      rate = interpolateRateAtYear(sorted, y);
      if (y === purchaseYear) rate = purchaseRate;
      if (y === currentYear && endRate > 0) rate = endRate;
    }

    const roundedRate = Math.round(Math.max(0, rate));
    series.push({
      year: y,
      ratePerSqyd: roundedRate,
      value: Math.round(roundedRate * sqydArea),
    });
  }
  return series;
}

/**
 * @param {{ year: number, ratePerSqyd: number }[]} milestones
 * @param {number} year
 */
function interpolateRateAtYear(milestones, year) {
  if (year <= milestones[0].year) return milestones[0].ratePerSqyd;
  const last = milestones[milestones.length - 1];
  if (year >= last.year) return last.ratePerSqyd;

  for (let i = 0; i < milestones.length - 1; i++) {
    const a = milestones[i];
    const b = milestones[i + 1];
    if (year >= a.year && year <= b.year) {
      const span = b.year - a.year || 1;
      const t = (year - a.year) / span;
      return a.ratePerSqyd + (b.ratePerSqyd - a.ratePerSqyd) * t;
    }
  }
  return last.ratePerSqyd;
}

/** Evenly spaced year labels for charts (10–100+ year spans). */
export function computeYearAxisTicks(startYear, endYear, maxTicks = 5) {
  const start = Number(startYear);
  const end = Number(endYear);
  if (!start || !end || end < start) return start ? [start] : [];
  const span = end - start;
  if (span <= maxTicks - 1) {
    return Array.from({ length: span + 1 }, (_, i) => start + i);
  }
  const rawStep = span / (maxTicks - 1);
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(rawStep, 1)));
  const step = Math.max(1, Math.ceil(rawStep / magnitude) * magnitude);
  const ticks = [start];
  let y = start + step;
  while (y < end) {
    ticks.push(y);
    y += step;
  }
  if (ticks[ticks.length - 1] !== end) ticks.push(end);
  return ticks;
}

/**
 * @param {import('./wealthStorage.js').WealthEntry} entry
 * @returns {{ year: number, value: number, ratePerSqyd?: number, source: 'ai' | 'linear' }[]}
 */
export function buildPropertyValueSeries(entry) {
  const currentYear = new Date().getFullYear();
  const purchaseYear = entry.purchaseYear ? Number(entry.purchaseYear) : null;
  const currentValue = Number(entry.value) || 0;
  const purchasePrice = Number(entry.purchasePrice) || 0;

  if (
    Array.isArray(entry.valueHistorySeries) &&
    entry.valueHistorySeries.length >= 2
  ) {
    return entry.valueHistorySeries.map((p) => ({
      year: Number(p.year),
      value: Number(p.value),
      ratePerSqyd: p.ratePerSqyd != null ? Number(p.ratePerSqyd) : undefined,
      source: "ai",
    }));
  }

  if (!purchaseYear || !purchasePrice || !currentValue || purchaseYear >= currentYear) {
    if (currentValue > 0) {
      return [{ year: currentYear, value: currentValue, source: "linear" }];
    }
    return [];
  }

  const yearsHeld = currentYear - purchaseYear;
  /** @type {{ year: number, value: number, source: 'linear' }[]} */
  const linear = [];
  for (let y = 0; y <= yearsHeld; y++) {
    const year = purchaseYear + y;
    const fraction = yearsHeld > 0 ? y / yearsHeld : 1;
    linear.push({
      year,
      value: Math.round(purchasePrice + (currentValue - purchasePrice) * fraction),
      source: "linear",
    });
  }
  return linear;
}

/**
 * Build expand opts from a wealth entry or insight fields object.
 * @param {object} fields
 * @param {number} [marketRatePerSqyd]
 */
export function buildHistoryExpandOpts(fields, marketRatePerSqyd) {
  const area = Number(fields.areaMeasure) || 0;
  const currentValue = Number(fields.currentValue ?? fields.value) || 0;
  const purchaseRatePerUnit = Number(fields.purchaseRatePerUnit) || 0;
  const mkt =
    Number(marketRatePerSqyd) ||
    Number(fields.marketRatePerSqyd) ||
    0;
  const currentRate =
    mkt > 0 ? mkt : area > 0 && currentValue > 0 ? currentValue / area : 0;

  return {
    purchaseRatePerUnit: purchaseRatePerUnit > 0 ? purchaseRatePerUnit : undefined,
    currentRate: currentRate > 0 ? currentRate : undefined,
    areaUnit: fields.areaUnit || "sqyd",
  };
}
