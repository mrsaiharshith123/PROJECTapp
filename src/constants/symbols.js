/** ASCII-safe currency and punctuation (avoids Windows encoding issues). */
export const INR = "\u20B9";
export const EM_DASH = "\u2014";
export const ARROW = "\u2192";
export const CHEVRON = "\u203A";

/** Semantic icon keys — render with CtIcon in UI. */
export const TOOL_ICONS = {
  planner: "calculator",
  loan: "chart-line-down",
  insurance: "shield",
  invest: "chart-line-up",
  chit: "coin",
  bond: "receipt",
  incomeTax: "currency-inr",
  retirement: "bank",
  safety: "shield",
  advisor: "chat-dots",
  goals: "target",
  logSpend: "note-pencil",
};

export function formatInr(amount) {
  return `${INR}${Number(amount || 0).toLocaleString("en-IN")}`;
}

/** Compact axis labels for charts (₹45L, ₹1.2Cr). */
export function formatCompactInr(amount) {
  const v = Math.abs(Number(amount) || 0);
  const sign = Number(amount) < 0 ? "-" : "";
  if (v >= 1e7) return `${sign}${INR}${(v / 1e7).toFixed(v >= 1e8 ? 0 : 1)}Cr`;
  if (v >= 1e5) return `${sign}${INR}${(v / 1e5).toFixed(v >= 1e6 ? 0 : 1)}L`;
  if (v >= 1e3) return `${sign}${INR}${Math.round(v / 1e3)}K`;
  return `${sign}${INR}${Math.round(v)}`;
}

/** Mask currency when privacy mode is on. */
export function formatPrivateInr(privacyMode, amount, mask = "••••") {
  if (privacyMode) return mask;
  return formatInr(amount);
}
