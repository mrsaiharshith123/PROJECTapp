/**
 * India-oriented net-worth context vs age and income (illustrative percentiles).
 * Educational only — not financial advice.
 */

/** Median net-worth multiples of annual income by age band (India salaried, illustrative). */
const AGE_BANDS = [
  { maxAge: 25, multiple: 0.5, labelKey: "netWorth.benchmark.ageUnder25" },
  { maxAge: 30, multiple: 1.2, labelKey: "netWorth.benchmark.age25_30" },
  { maxAge: 35, multiple: 2.5, labelKey: "netWorth.benchmark.age30_35" },
  { maxAge: 40, multiple: 4, labelKey: "netWorth.benchmark.age35_40" },
  { maxAge: 45, multiple: 6, labelKey: "netWorth.benchmark.age40_45" },
  { maxAge: 55, multiple: 8, labelKey: "netWorth.benchmark.age45_55" },
  { maxAge: 120, multiple: 10, labelKey: "netWorth.benchmark.age55Plus" },
];

function bandForAge(age) {
  const a = Math.max(18, Math.floor(Number(age) || 30));
  return AGE_BANDS.find((b) => a <= b.maxAge) || AGE_BANDS[AGE_BANDS.length - 1];
}

/**
 * @param {{ netWorth: number, monthlyIncome?: number, age?: number }} input
 */
export function benchmarkNetWorth(input) {
  const netWorth = Math.max(0, Number(input.netWorth) || 0);
  const monthlyIncome = Math.max(0, Number(input.monthlyIncome) || 0);
  const age = Math.max(18, Math.floor(Number(input.age) || 30));
  const annualIncome = monthlyIncome * 12;
  const band = bandForAge(age);
  const peerMedian = Math.round(annualIncome * band.multiple);
  const ratio = peerMedian > 0 ? netWorth / peerMedian : null;
  const percentile =
    ratio == null
      ? null
      : ratio >= 1.4
        ? 75
        : ratio >= 1
          ? 60
          : ratio >= 0.7
            ? 45
            : ratio >= 0.4
              ? 30
              : 15;

  let tone = "info";
  let insightId = "networth-benchmark-on-track";
  if (ratio != null) {
    if (ratio >= 1.2) insightId = "networth-benchmark-ahead";
    else if (ratio < 0.5) {
      insightId = "networth-benchmark-behind";
      tone = "caution";
    }
  }

  return {
    netWorth: Math.round(netWorth),
    peerMedian,
    age,
    annualIncome: Math.round(annualIncome),
    ageBandKey: band.labelKey,
    ratioToPeer: ratio != null ? Math.round(ratio * 100) / 100 : null,
    estimatedPercentile: percentile,
    insightId,
    tone,
  };
}
