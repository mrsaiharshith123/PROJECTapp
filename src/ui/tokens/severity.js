const TONE_CLASS = {
  neutral: "ct-inset",
  info: "ct-insight ct-insight-info rounded-xl",
  warning: "ct-insight ct-insight-warning rounded-xl",
  critical: "ct-insight ct-insight-warning rounded-xl",
  positive: "ct-insight rounded-xl",
  success: "ct-insight rounded-xl",
};

export function insightToneClass(tone = "neutral") {
  return TONE_CLASS[tone] || TONE_CLASS.neutral;
}
