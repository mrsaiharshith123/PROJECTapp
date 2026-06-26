/** Insight carousel card definitions — analysis layer only (no raw record forms). */
export const INSIGHT_CARDS = [
  { id: "pulse", labelKey: "analytics.insightCard.pulse", kickerKey: "analytics.insightKicker.pulse", icon: "heartbeat", accent: "agr", accentVar: "--pos-agr" },
  { id: "cashflow", labelKey: "analytics.insightCard.cashflow", kickerKey: "analytics.insightKicker.cashflow", icon: "calendar-blank", accent: "asset", accentVar: "--pos-asset" },
  { id: "spending", labelKey: "analytics.insightCard.spending", kickerKey: "analytics.insightKicker.spending", icon: "chart-donut", accent: "liab", accentVar: "--pos-liab" },
  { id: "paycheck", labelKey: "analytics.insightCard.paycheck", kickerKey: "analytics.insightKicker.paycheck", icon: "currency-inr", accent: "inst", accentVar: "--pos-inst" },
  { id: "score", labelKey: "analytics.insightCard.score", kickerKey: "analytics.insightKicker.score", icon: "gauge", accent: "agr", accentVar: "--pos-agr" },
  { id: "assets", labelKey: "analytics.insightCard.assets", kickerKey: "analytics.insightKicker.assets", icon: "trend-up", accent: "asset", accentVar: "--pos-asset" },
  { id: "liabilities", labelKey: "analytics.insightCard.liabilities", kickerKey: "analytics.insightKicker.liabilities", icon: "arrow-down", accent: "liab", accentVar: "--pos-liab" },
  { id: "instruments", labelKey: "analytics.insightCard.instruments", kickerKey: "analytics.insightKicker.instruments", icon: "umbrella", accent: "inst", accentVar: "--pos-inst" },
];

export const INSIGHT_GRADIENTS = {
  agr: "linear-gradient(150deg,rgba(99,102,241,0.10),rgba(13,14,24,0.95) 60%)",
  asset: "linear-gradient(150deg,rgba(16,185,129,0.10),rgba(13,14,24,0.95) 60%)",
  liab: "linear-gradient(150deg,rgba(244,63,94,0.10),rgba(13,14,24,0.95) 60%)",
  inst: "linear-gradient(150deg,rgba(139,92,246,0.10),rgba(13,14,24,0.95) 60%)",
};

export const INSIGHT_GLOWS = {
  agr: "rgba(99,102,241,0.18)",
  asset: "rgba(16,185,129,0.18)",
  liab: "rgba(244,63,94,0.18)",
  inst: "rgba(139,92,246,0.18)",
};

export const INSIGHT_BORDERS = {
  agr: "var(--pos-agr-border)",
  asset: "var(--pos-asset-border)",
  liab: "var(--pos-liab-border)",
  inst: "var(--pos-inst-border)",
};

export function resolveInitialCardIndex(cardParam) {
  if (!cardParam) return 0;
  const idx = INSIGHT_CARDS.findIndex((c) => c.id === cardParam);
  return idx >= 0 ? idx : 0;
}
