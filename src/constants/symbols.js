/** ASCII-safe currency and punctuation (avoids Windows encoding issues). */
export const INR = "\u20B9";
export const EM_DASH = "\u2014";
export const ARROW = "\u2192";
export const CHEVRON = "\u203A";

/** Semantic icon keys — render with CtIcon in UI. */
export const STATUS_ICONS = {
  paid: "check",
  pending: "calendar",
  overdue: "warning",
  upnext: "arrows-clockwise",
};

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
  logSpend: "note-pencil",
};

export function formatInr(amount) {
  return `${INR}${Number(amount || 0).toLocaleString("en-IN")}`;
}
