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
  planner: "\u{1F9EE}",
  loan: "\u{1F4C9}",
  insurance: "\u{1F6E1}\uFE0F",
  chit: "\u{1FA99}",
  bond: "\u{1F9FE}",
  incomeTax: "\u{1F4B8}",
};

export function formatInr(amount) {
  return `${INR}${Number(amount || 0).toLocaleString("en-IN")}`;
}
