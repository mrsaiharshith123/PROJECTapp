const TONE_CLASS = {
  neutral: "ed-inset",
  info: "ed-inset rounded-xl",
  warning: "ed-inset-amber rounded-xl",
  critical: "ed-inset-amber rounded-xl",
  positive: "ed-inset rounded-xl",
  success: "ed-inset-green rounded-xl",
  teal: "ed-inset-green px-3 py-2.5 text-sm leading-relaxed border rounded-xl",
  coral: "ed-inset px-3 py-2.5 text-sm leading-relaxed border rounded-xl",
};

export function insightToneClass(tone = "neutral") {
  return TONE_CLASS[tone] || TONE_CLASS.neutral;
}
