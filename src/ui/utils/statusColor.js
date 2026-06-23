/**
 * Financial pressure score (0–100) → semantic tone.
 * @param {number | null | undefined} score
 * @returns {"success"|"teal"|"warning"|"coral"|"danger"|"neutral"}
 */
export function pressureTone(score) {
  if (score == null) return "neutral";
  if (score < 40) return "success";
  if (score < 60) return "teal";
  if (score < 70) return "warning";
  if (score < 80) return "coral";
  return "danger";
}
