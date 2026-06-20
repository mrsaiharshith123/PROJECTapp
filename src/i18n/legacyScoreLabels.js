import { LEGACY_SCORE_MAP } from "../constants/metricTaxonomy.js";

/** Profile detail row id → legacy engine key in LEGACY_SCORE_MAP. */
export const DETAIL_SCORE_LEGACY_IDS = {
  pressure: "pressureScore",
  health: "financialHealth",
  runway: "stabilityPlan",
  flexibility: "pressureAdvanced",
  debt: "cibilScore",
  "lending-trust": "lendingTrust",
};

/**
 * @param {string} legacyId
 * @returns {'child' | 'trend' | 'hidden' | 'setup' | undefined}
 */
export function legacyScoreRole(legacyId) {
  return LEGACY_SCORE_MAP[legacyId]?.role;
}

/** @param {string} legacyId */
export function isLegacyScoreHidden(legacyId) {
  return legacyScoreRole(legacyId) === "hidden";
}

/**
 * User-facing title key — Perovo pillar label when mapped, else fallback.
 * @param {string} detailId
 * @param {string} fallbackKey
 */
export function userFacingScoreTitleKey(detailId, fallbackKey) {
  if (detailId === "lending-trust") return fallbackKey;
  const legacyId = DETAIL_SCORE_LEGACY_IDS[detailId];
  const pillar = legacyId ? LEGACY_SCORE_MAP[legacyId]?.pillar : null;
  if (pillar) return `perovoScore.pillar.${pillar}`;
  return fallbackKey;
}

/**
 * Drop detail rows mapped as hidden; remap titles to pillar vocabulary.
 * @param {any[]} scores
 * @returns {any[]}
 */
export function applyLegacyScoreTaxonomy(scores) {
  return scores
    .filter((score) => {
      const legacyId = DETAIL_SCORE_LEGACY_IDS[score.id];
      return !legacyId || !isLegacyScoreHidden(legacyId);
    })
    .map((score) => ({
      ...score,
      titleKey: userFacingScoreTitleKey(score.id, score.titleKey),
      subScores: (score.subScores || []).filter(
        (sub) => sub.labelKey !== "netWorth.lifeScore.title",
      ),
    }));
}
