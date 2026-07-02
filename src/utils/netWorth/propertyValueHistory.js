/**
 * Expand AI milestone rates into a yearly value series for charts.
 * @param {{ year: number, ratePerSqyd: number }[]} milestones
 * @param {number} area
 * @param {number} purchaseYear
 * @param {number} currentYear
 * @param {number} [purchasePrice]
 */
export function expandMilestonesToSeries(milestones, area, purchaseYear, currentYear, purchasePrice = 0) {
  if (!milestones?.length || !area || area <= 0 || !purchaseYear || currentYear < purchaseYear) {
    return [];
  }

  const sorted = [...milestones]
    .map((m) => ({
      year: Number(m.year),
      ratePerSqyd: Number(m.ratePerSqyd),
    }))
    .filter((m) => m.year && m.ratePerSqyd > 0 && !Number.isNaN(m.ratePerSqyd))
    .sort((a, b) => a.year - b.year);

  if (!sorted.length) return [];

  const purchaseRate =
    purchasePrice > 0 ? purchasePrice / area : sorted[0].ratePerSqyd;

  if (sorted[0].year > purchaseYear) {
    sorted.unshift({ year: purchaseYear, ratePerSqyd: purchaseRate });
  } else {
    sorted[0].ratePerSqyd = purchaseRate;
  }

  const last = sorted[sorted.length - 1];
  if (last.year < currentYear) {
    sorted.push({ year: currentYear, ratePerSqyd: last.ratePerSqyd });
  }

  /** @type {{ year: number, value: number, ratePerSqyd: number }[]} */
  const series = [];
  for (let y = purchaseYear; y <= currentYear; y++) {
    const rate = interpolateRateAtYear(sorted, y);
    series.push({
      year: y,
      ratePerSqyd: Math.round(rate),
      value: Math.round(rate * area),
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
