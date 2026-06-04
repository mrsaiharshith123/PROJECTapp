/**
 * Financial concept explanations — human language for tooltips and help.
 * @typedef {{ title: string, short: string, why: string, action?: string, calc?: string }} ConceptDef
 */

/** @type {Record<string, ConceptDef>} */
export const FINANCIAL_CONCEPTS = {
  pressureScore: {
    title: "Pressure score",
    short: "How loaded your recurring bills feel compared to income.",
    why: "High pressure means less room if income pauses or a surprise expense hits.",
    action: "Review EMIs and subscriptions, or add income in Profile if it changed.",
    calc: "Based on monthly bill burden vs your income.",
  },
  stability: {
    title: "Stability",
    short: "A quick read on whether this month looks manageable.",
    why: "It combines what's due, what's paid, and how much income is left.",
    action: "Open Financial pulse for what's driving the score.",
  },
  freeCash: {
    title: "Cash left",
    short: "Estimated money left after typical monthly obligations.",
    why: "This is your flexibility for savings, goals, or one-off spending.",
    action: "Add missing bills so the number reflects your real life.",
  },
  survival: {
    title: "Survivability",
    short: "How long finances may hold if main income stops today.",
    why: "Liquid savings and lower monthly burn extend this period.",
    action: "Build emergency savings and trim optional recurring costs.",
  },
  runway: {
    title: "Runway",
    short: "How long current reserves may cover ongoing obligations.",
    why: "Runway shrinks when burn rises or savings are used.",
    action: "Track large upcoming dues in Bills.",
  },
  emergency: {
    title: "Emergency readiness",
    short: "Whether savings can cover several months of typical burn.",
    why: "A buffer reduces stress when income or health surprises happen.",
    action: "Set liquid savings in Profile.",
  },
  burden: {
    title: "Monthly burden",
    short: "Recurring and due obligations normalized to a monthly view.",
    why: "Burden is the base for pressure, free cash, and forecasts.",
    action: "Mark bills paid on time to keep forecasts accurate.",
  },
  volatility: {
    title: "Income consistency",
    short: "How steady your income has been across recent months.",
    why: "Uneven months make planning harder than a single average.",
    action: "Log income each month in Profile for a clearer picture.",
  },
  householdSafety: {
    title: "Household safety",
    short: "How comfortably shared family obligations fit household income.",
    why: "School fees, insurance, and rent spikes affect the whole home.",
    action: "Tag school and insurance bills for better household views.",
  },
  payStreak: {
    title: "Pay streak",
    short: "Consecutive months where you recorded at least one payment.",
    why: "A steady streak usually means fewer surprises and better forecasts.",
    action: "Log payments when you pay a bill or lending installment.",
  },
  billControl: {
    title: "Bill control",
    short: "How on-top you are with active bills right now.",
    why: "Overdue and critical open items lower the score until you catch up.",
    action: "Clear overdue bills in Bills, or adjust amounts if something changed.",
  },
};

export function getConcept(id) {
  return FINANCIAL_CONCEPTS[id] || null;
}

export function conceptHelpText(id) {
  const c = getConcept(id);
  if (!c) return "";
  return [c.short, c.why, c.action].filter(Boolean).join(" ");
}
