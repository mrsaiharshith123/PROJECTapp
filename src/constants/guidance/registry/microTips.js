/** Brief insights — rotate on Home (i18n keys). */
export const MICRO_TIP_KEYS = [
  "microTip.0",
  "microTip.1",
  "microTip.2",
  "microTip.3",
  "microTip.4",
];

/** @param {number} [seed] */
export function pickMicroTip(seed = 0) {
  return MICRO_TIP_KEYS[Math.abs(seed) % MICRO_TIP_KEYS.length];
}
