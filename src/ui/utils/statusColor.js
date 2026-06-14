/** @typedef {'success'|'teal'|'warning'|'coral'|'danger'|'neutral'} SemanticTone */

/**
 * Map bill / health status tokens to semantic UI tones.
 * @param {string | null | undefined} status
 * @returns {SemanticTone}
 */
export function statusTone(status) {
  switch (status) {
    case "paid":
    case "safe":
    case "good":
    case "excellent":
    case "thriving":
      return "success";
    case "improving":
      return "teal";
    case "due-soon":
    case "caution":
    case "watch":
    case "moderate":
    case "upnext":
    case "pending":
      return "warning";
    case "elevated":
    case "high-risk":
      return "coral";
    case "overdue":
    case "critical":
    case "danger":
    case "fragile":
      return "danger";
    default:
      return "neutral";
  }
}

/**
 * Financial pressure score (0–100) → semantic tone.
 * @param {number | null | undefined} score
 * @returns {SemanticTone}
 */
export function pressureTone(score) {
  if (score == null) return "neutral";
  if (score < 40) return "success";
  if (score < 60) return "teal";
  if (score < 70) return "warning";
  if (score < 80) return "coral";
  return "danger";
}
