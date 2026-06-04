/** Lightweight learning moments — rotate on Home. */
export const MICRO_TIPS = [
  "Recurring obligations reduce flexibility when income pauses.",
  "Strong emergency savings make survivability less stressful.",
  "Marking bills paid keeps forecasts and pressure honest.",
  "Household safety improves when big renewals are visible early.",
  "Optional subscriptions are the easiest place to reclaim cash.",
];

export function pickMicroTip(seed = 0) {
  return MICRO_TIPS[Math.abs(seed) % MICRO_TIPS.length];
}
