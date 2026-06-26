import { INSIGHT_CARDS } from "../analytics/insightCarouselConfig.js";

/** Extra cards used only in the yearly spending section. */
export const YEARLY_INSIGHT_CARDS = [
  {
    id: "yearly-burden",
    labelKey: "analytics.yearly.burdenCard",
    kickerKey: "analytics.insightKicker.yearlyBurden",
    icon: "calendar-blank",
    accent: "liab",
    accentVar: "--pos-liab",
  },
  {
    id: "yearly-spend",
    labelKey: "analytics.yearly.variableCard",
    kickerKey: "analytics.insightKicker.yearlySpend",
    icon: "chart-donut",
    accent: "inst",
    accentVar: "--pos-inst",
  },
];

export const ALL_INSIGHT_CARDS = [...INSIGHT_CARDS, ...YEARLY_INSIGHT_CARDS];

/** @param {string} id */
export function getInsightCard(id) {
  return ALL_INSIGHT_CARDS.find((c) => c.id === id) ?? null;
}

/** Vertical hub sections — each has its own horizontal swipe carousel. */
export const INSIGHT_SECTIONS = [
  {
    id: "monthly",
    titleKey: "analytics.monthly.title",
    subtitleKey: "analytics.monthly.subtitle",
    cards: ["spending", "paycheck"],
    breakdownPath: "/insights/spending",
  },
  {
    id: "yearly",
    titleKey: "analytics.yearly.title",
    subtitleKey: "analytics.yearly.subtitle",
    cards: ["yearly-burden", "yearly-spend"],
    breakdownPath: "/insights/spending/yearly",
  },
  {
    id: "stability",
    titleKey: "analytics.section.stability",
    subtitleKey: "analytics.section.stabilityHint",
    cards: ["pulse", "cashflow"],
    breakdownPath: null,
  },
  {
    id: "score",
    titleKey: "analytics.insightCard.score",
    subtitleKey: "analytics.insightScore.subtitle",
    cards: ["score"],
    breakdownPath: "/insights/score",
  },
  {
    id: "networth",
    titleKey: "analytics.section.networth",
    subtitleKey: "analytics.wealth.subtitle",
    cards: ["assets", "liabilities", "instruments"],
    breakdownPath: "/insights/networth",
  },
];

/** @param {string} cardId */
export function getInsightBreakdownPath(cardId) {
  const paths = {
    pulse: "/insights/pulse",
    cashflow: "/insights/cashflow",
    spending: "/insights/spending",
    paycheck: "/insights/spending",
    "yearly-burden": "/insights/spending/yearly",
    "yearly-spend": "/insights/spending/yearly",
    score: "/insights/score",
    assets: "/insights/assets",
    liabilities: "/insights/liabilities",
    instruments: "/insights/instruments",
  };
  return paths[cardId] ?? null;
}

/** @param {string | null} cardParam */
export function findSectionForCard(cardParam) {
  if (!cardParam) return null;
  return INSIGHT_SECTIONS.find((s) => s.cards.includes(cardParam)) ?? null;
}
