/**
 * Maps semantic tones from engines to ct-* presentation classes.
 * Engines return tone tokens only — map score/tier → tone in engines (e.g. affordabilityTierTone).
 */

/** @typedef {'success'|'info'|'warning'|'coral'|'danger'|'teal'|'neutral'|'gold'|'premium'} SemanticTone */

const TONE_CLASS = {
  success: "ct-status ct-status-success",
  warning: "ct-status ct-status-warning",
  danger: "ct-status ct-status-danger",
  info: "ct-status ct-status-info",
  teal: "ct-badge ct-badge-teal",
  coral: "ct-badge ct-badge-coral",
  neutral: "ct-status ct-status-neutral",
  gold: "ct-badge ct-badge-gold",
  premium: "ct-badge ct-badge-gold",
};

/**
 * @param {SemanticTone | string | null | undefined} tone
 * @returns {string}
 */
export function semanticToneToClass(tone) {
  return TONE_CLASS[tone] || TONE_CLASS.neutral;
}
