const TONE_CLASS = {
  neutral: "ct-inset",
  info: "ct-insight ct-insight-info rounded-xl",
  warning: "ct-insight ct-insight-warning rounded-xl",
  critical: "ct-insight ct-insight-warning rounded-xl",
  positive: "ct-insight rounded-xl",
  success: "ct-insight rounded-xl",
  teal: "ct-tone-teal px-3 py-2.5 text-sm leading-relaxed border rounded-xl",
  coral: "ct-tone-coral px-3 py-2.5 text-sm leading-relaxed border rounded-xl",
};

export function insightToneClass(tone = "neutral") {
  return TONE_CLASS[tone] || TONE_CLASS.neutral;
}
