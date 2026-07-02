/**
 * Per-bill health score (0–100) with i18n insight id.
 * @param {object} commitment
 * @param {{
 *   effectiveStatus: string,
 *   todayStr?: string,
 *   topStressorName?: string | null,
 * }} ctx
 */
export function scoreBillHealth(commitment, ctx) {
  const eff = ctx.effectiveStatus || "pending";
  let score = 82;
  /** @type {string | null} */
  let insightId = null;
  /** @type {Record<string, unknown> | undefined} */
  let params;

  if (eff === "paid") {
    return { score: 92, band: "good", insightId: "bill-health-paid", params: undefined };
  }

  if (eff === "overdue") {
    score = 18;
    insightId = "bill-health-overdue";
  } else if (eff === "upnext") {
    score = 52;
    insightId = "bill-health-due-soon";
  }

  const name = String(commitment.name || "").trim();
  const isEmi =
    commitment.category === "EMI" ||
    commitment.category === "Loan" ||
    commitment.category === "Credit Card";

  if (ctx.topStressorName && name && ctx.topStressorName === name) {
    score = Math.min(score, 38);
    insightId = "bill-health-top-stress";
    params = { name };
  }

  if (isEmi && Number(commitment.remainingAmount) > 0 && eff === "pending") {
    const remaining = Number(commitment.remainingAmount) || 0;
    const amount = Number(commitment.amount) || 1;
    if (remaining / amount > 24) {
      score = Math.min(score, 55);
      if (!insightId) insightId = "bill-health-long-emi";
    }
  }

  const band = score >= 70 ? "good" : score >= 45 ? "watch" : "stress";
  return { score, band, insightId, params };
}

/**
 * @param {object[]} commitments
 * @param {(c: object) => string} getEffectiveStatus
 * @param {object} ctx
 */
export function scoreAllBillsHealth(commitments, getEffectiveStatus, ctx = {}) {
  return (commitments || []).map((c) => ({
    id: c.id,
    ...scoreBillHealth(c, { ...ctx, effectiveStatus: getEffectiveStatus(c) }),
  }));
}

/** Portfolio-level bill control score (0–100). */
export function aggregateBillHealthScore(scoredRows) {
  const rows = scoredRows || [];
  if (!rows.length) return { score: 100, band: "good", stressCount: 0, watchCount: 0 };
  const avg = Math.round(rows.reduce((s, r) => s + (r.score || 0), 0) / rows.length);
  const stressCount = rows.filter((r) => r.band === "stress").length;
  const watchCount = rows.filter((r) => r.band === "watch").length;
  const band = avg >= 70 ? "good" : avg >= 45 ? "watch" : "stress";
  let insightId = "bill-portfolio-healthy";
  let tone = "positive";
  if (stressCount > 0) {
    insightId = "bill-portfolio-stress";
    tone = "critical";
  } else if (watchCount >= 2) {
    insightId = "bill-portfolio-watch";
    tone = "warning";
  }
  return { score: avg, band, stressCount, watchCount, insightId, tone };
}
