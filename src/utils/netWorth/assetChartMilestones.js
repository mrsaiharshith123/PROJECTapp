/**
 * Build annotation milestones for the asset value chart.
 * @typedef {{ year: number, labelKey: string, labelParams?: Record<string, string | number>, kind?: string, seriesIndex?: number }} ChartMilestone
 */

const COVID_YEAR = 2020;

/** Normalised Indian gold price index (10g jewellery, approximate). */
const GOLD_PRICE_INDEX = [
  { year: 2010, idx: 1.0 },
  { year: 2011, idx: 1.34 },
  { year: 2013, idx: 1.05 },
  { year: 2015, idx: 0.84 },
  { year: 2018, idx: 0.92 },
  { year: 2020, idx: 1.18 },
  { year: 2022, idx: 1.12 },
  { year: 2023, idx: 1.28 },
  { year: 2024, idx: 1.35 },
  { year: 2025, idx: 1.4 },
];

/**
 * @param {number} year
 */
function goldIndexAtYear(year) {
  if (year <= GOLD_PRICE_INDEX[0].year) return GOLD_PRICE_INDEX[0].idx;
  const last = GOLD_PRICE_INDEX[GOLD_PRICE_INDEX.length - 1];
  if (year >= last.year) return last.idx;
  for (let i = 0; i < GOLD_PRICE_INDEX.length - 1; i++) {
    const a = GOLD_PRICE_INDEX[i];
    const b = GOLD_PRICE_INDEX[i + 1];
    if (year >= a.year && year <= b.year) {
      const t = (year - a.year) / (b.year - a.year || 1);
      return a.idx + (b.idx - a.idx) * t;
    }
  }
  return last.idx;
}

/**
 * Gold chart series shaped by historical price turning points (not flat CAGR).
 * @param {import('./wealthStorage.js').WealthEntry} entry
 */
export function buildGoldAnchorSeries(entry) {
  const purchaseYear = entry.purchaseYear ? Number(entry.purchaseYear) : null;
  const purchasePrice = Number(entry.purchasePrice) || 0;
  const currentValue = Number(entry.value) || 0;
  const currentYear = new Date().getFullYear();
  if (!purchaseYear || !purchasePrice || !currentValue || purchaseYear >= currentYear) return [];

  const idxStart = goldIndexAtYear(purchaseYear);
  const idxEnd = goldIndexAtYear(currentYear);
  const scale = idxEnd > idxStart ? (currentValue - purchasePrice) / (idxEnd - idxStart) : 0;

  /** @type {{ year: number, value: number }[]} */
  const series = [];
  for (let y = purchaseYear; y <= currentYear; y++) {
    const idx = goldIndexAtYear(y);
    const value = Math.round(purchasePrice + (idx - idxStart) * scale);
    series.push({ year: y, value: Math.max(0, value) });
  }
  if (series.length) series[series.length - 1].value = currentValue;
  return series;
}

/** @type {{ year: number, labelKey: string, kind: string }[]} */
const GOLD_ANCHORS = [
  { year: 2011, labelKey: "wealthDetail.graph.milestone.goldPeak2011", kind: "peak" },
  { year: 2015, labelKey: "wealthDetail.graph.milestone.goldLow2015", kind: "dip" },
  { year: 2020, labelKey: "wealthDetail.graph.milestone.covid", kind: "dip" },
  { year: 2023, labelKey: "wealthDetail.graph.milestone.goldHigh2023", kind: "peak" },
];

/**
 * @param {{ year: number, value: number }[]} series
 * @param {number} [minPct]
 */
function detectLocalExtrema(series, minPct = 12) {
  if (!series || series.length < 3) return [];
  /** @type {ChartMilestone[]} */
  const out = [];
  for (let i = 1; i < series.length - 1; i++) {
    const prev = series[i - 1].value;
    const curr = series[i].value;
    const next = series[i + 1].value;
    if (!prev || !curr || !next) continue;

    if (curr >= prev && curr >= next && curr > prev) {
      const jump = ((curr - prev) / prev) * 100;
      if (jump >= minPct) {
        out.push({
          year: series[i].year,
          labelKey: "wealthDetail.graph.milestone.boom",
          labelParams: { pct: Math.round(jump) },
          kind: "peak",
        });
      }
    }
    if (curr <= prev && curr <= next && curr < prev) {
      const drop = ((prev - curr) / prev) * 100;
      if (drop >= minPct) {
        out.push({
          year: series[i].year,
          labelKey: "wealthDetail.graph.milestone.dip",
          labelParams: { pct: Math.round(drop) },
          kind: "dip",
        });
      }
    }
  }
  return out;
}

/**
 * @param {number} year
 * @param {{ year: number }[]} series
 */
function nearestSeriesIndex(year, series) {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < series.length; i++) {
    const dist = Math.abs(series[i].year - year);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

/**
 * @param {ChartMilestone[]} items
 * @param {{ year: number }[]} series
 */
function attachSeriesIndices(items, series) {
  const used = new Set();
  return items
    .map((m) => {
      const idx = nearestSeriesIndex(m.year, series);
      if (used.has(idx)) return null;
      used.add(idx);
      return { ...m, seriesIndex: idx };
    })
    .filter(Boolean);
}

/**
 * @param {import('./wealthStorage.js').WealthEntry} entry
 * @param {{ valueSeries?: { year: number, value: number }[], valueSeriesSource?: string, purchaseYear?: number | null }} intel
 */
export function buildAssetChartMilestones(entry, intel) {
  const series = intel.valueSeries || [];
  if (series.length < 2) return [];

  const startYear = series[0].year;
  const endYear = series[series.length - 1].year;
  const inRange = (y) => y >= startYear && y <= endYear;

  /** @type {ChartMilestone[]} */
  let raw = [];

  const purchaseYear = entry.purchaseYear ? Number(entry.purchaseYear) : intel.purchaseYear;
  if (purchaseYear && inRange(purchaseYear)) {
    raw.push({
      year: purchaseYear,
      labelKey: "wealthDetail.graph.milestone.purchase",
      kind: "purchase",
    });
  }

  if (inRange(COVID_YEAR)) {
    raw.push({
      year: COVID_YEAR,
      labelKey: "wealthDetail.graph.milestone.covid",
      kind: "dip",
    });
  }

  if (entry.categoryId === "gold") {
    for (const anchor of GOLD_ANCHORS) {
      if (inRange(anchor.year)) {
        raw.push({ year: anchor.year, labelKey: anchor.labelKey, kind: anchor.kind });
      }
    }
  }

  if (entry.categoryId === "stocks" && Array.isArray(entry.corporateActions)) {
    for (const action of entry.corporateActions) {
      if (!action?.date) continue;
      const y = Number(String(action.date).slice(0, 4));
      if (!y || !inRange(y)) continue;
      raw.push({
        year: y,
        labelKey: `wealthDetail.graph.milestone.action.${action.type || "event"}`,
        kind: "event",
      });
    }
  }

  if (intel.valueSeriesSource === "ai" || entry.categoryId?.startsWith("property")) {
    raw.push(...detectLocalExtrema(series, 10));
  }

  if (entry.categoryId === "vehicle" && entry.vehicleYear) {
    const sellYear = Number(entry.vehicleYear) + 5;
    if (inRange(sellYear)) {
      raw.push({
        year: sellYear,
        labelKey: "wealthDetail.graph.milestone.sellWindow",
        kind: "event",
      });
    }
  }

  raw.push({
    year: endYear,
    labelKey: "wealthDetail.graph.milestone.today",
    kind: "endpoint",
  });

  // De-dupe by year (keep first label per year)
  const byYear = new Map();
  for (const m of raw) {
    if (!byYear.has(m.year)) byYear.set(m.year, m);
  }

  return attachSeriesIndices([...byYear.values()].sort((a, b) => a.year - b.year), series);
}
