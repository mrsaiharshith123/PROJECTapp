/**
 * Canonical Perovo metric taxonomy — one headline score, four pillars.
 * Legacy engine names map to pillars or trend-only (never user-facing labels).
 */

/** @typedef {'cashflow' | 'savings' | 'debt' | 'protection'} PerovoPillarId */

export const PEROVO_PILLAR_IDS = /** @type {const} */ (["cashflow", "savings", "debt", "protection"]);

const PILLAR_UI = {
  cashflow: { icon: "currency-inr", tone: "indigo" },
  savings: { icon: "shield", tone: "teal" },
  debt: { icon: "credit-card", tone: "amber" },
  protection: { icon: "target", tone: "violet" },
};

/** User-facing pillar order on Home and score detail. */
export const PEROVO_PILLARS = PEROVO_PILLAR_IDS.map((id) => ({ id, ...PILLAR_UI[id] }));

/**
 * Legacy score / label → pillar child, trend-only, or hidden from UI.
 * @type {Record<string, { pillar?: PerovoPillarId, role: 'child' | 'trend' | 'hidden' | 'setup' }>}
 */
export const LEGACY_SCORE_MAP = {
  financialHealth: { pillar: "protection", role: "child" },
  financialLifeScore: { role: "hidden" },
  financialPosition: { role: "hidden" },
  profileScore: { role: "setup" },
  pressureScore: { pillar: "cashflow", role: "child" },
  pressureAdvanced: { role: "hidden" },
  pressureIntelligence: { role: "trend" },
  stabilityPlan: { pillar: "savings", role: "child" },
  billHealth: { pillar: "cashflow", role: "child" },
  momentumScore: { role: "trend" },
  cibilScore: { pillar: "debt", role: "child" },
  lendingTrust: { pillar: "debt", role: "child" },
};

/** FHN-style bands for the headline Perovo Score (0–100). */
export function perovoTierFromScore(score) {
  const s = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  if (s >= 80) return { id: "on_track", tone: "success" };
  if (s >= 40) return { id: "coping", tone: "warning" };
  return { id: "at_risk", tone: "danger" };
}
