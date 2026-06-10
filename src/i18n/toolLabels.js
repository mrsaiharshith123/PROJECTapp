/** @param {(key: string, params?: object) => string} t */
export function translateBondRecommendation(t, recommendation) {
  const map = {
    Good: "bond.verdict.good",
    "Not good": "bond.verdict.notGood",
    Borderline: "bond.verdict.borderline",
  };
  const key = map[recommendation] || "bond.verdict.borderline";
  return t(key);
}

/**
 * @param {(key: string, params?: object) => string} t
 * @param {{ verdict?: string, premiumShareOfIncome?: number | null }} analysis
 */
export function translateInsuranceVerdictDetail(t, analysis) {
  if (!analysis) return "";
  const verdict = analysis.verdict || "neutral";
  const baseKey =
    verdict === "positive"
      ? "insurance.verdict.detail.positive"
      : verdict === "mild"
        ? "insurance.verdict.detail.mild"
        : verdict === "negative"
          ? "insurance.verdict.detail.negative"
          : "insurance.verdict.detail.neutral";
  let text = t(baseKey);
  if (analysis.premiumShareOfIncome != null && analysis.premiumShareOfIncome > 15) {
    text += t("insurance.verdict.detail.incomeShare", {
      percent: analysis.premiumShareOfIncome.toFixed(1),
    });
  }
  return text;
}

/** @param {(key: string) => string} t @param {string} lifeCategoryId */
export function translateTxnLifeCategory(t, lifeCategoryId) {
  const key = `txnLife.${lifeCategoryId}`;
  const out = t(key);
  return out === key ? t("txnLife.other") : out;
}
