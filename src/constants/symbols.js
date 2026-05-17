/** ASCII-safe currency and punctuation (avoids Windows encoding issues). */
export const INR = "\u20B9";
export const EM_DASH = "\u2014";
export const ARROW = "\u2192";
export const CHEVRON = "\u203A";

export const STATUS_ICONS = {
  paid: "\u2705",
  pending: "\u{1F4C5}",
  overdue: "\u26A0\uFE0F",
  upnext: "\u{1F501}",
};

export const TOOL_ICONS = {
  afford: "\u{1F9EE}",
  insurance: "\u{1F6E1}\uFE0F",
  emi: "\u{1F4C9}",
  payoff: "\u{1F3AF}",
  goals: "\u{1F3C1}",
};

export function formatInr(amount) {
  return `${INR}${Number(amount || 0).toLocaleString("en-IN")}`;
}
