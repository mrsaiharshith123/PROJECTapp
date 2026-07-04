/**
 * Maps semantic tones from engines to ed-* presentation classes.
 * Engines return tone tokens only — map score/tier → tone in engines (e.g. affordabilityTierTone).
 */

/** @typedef {'success'|'info'|'warning'|'coral'|'danger'|'teal'|'neutral'|'gold'|'premium'} SemanticTone */

const TONE_CLASS = {
  success: "ed-pill ed-pill-green",
  warning: "ed-pill ed-pill-amber",
  danger: "ed-pill ed-pill-red",
  info: "ed-pill ed-pill-violet",
  teal: "ed-pill ed-pill-green",
  coral: "ed-pill ed-pill-red",
  neutral: "ed-pill ed-pill-neutral",
  gold: "ed-pill ed-pill-gold",
  premium: "ed-pill ed-pill-gold",
};

/**
 * @param {SemanticTone | string | null | undefined} tone
 * @returns {string}
 */
export function semanticToneToClass(tone) {
  return TONE_CLASS[tone] || TONE_CLASS.neutral;
}
