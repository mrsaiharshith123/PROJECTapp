import { useMemo } from "react";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import { useCommitIntel } from "./useCommitIntel.js";
import { useStabilityIntel } from "./useStabilityIntel.js";
import { useNetWorthIntel } from "./useNetWorthIntel.js";
import { useProfileHubIntel } from "./useProfileHubIntel.js";
import { computeControlScore } from "../utils/profileStats.js";
import { trustScoreForLendingEntry } from "../engines/lendingTrust.js";
import { formatInr } from "../constants/symbols.js";

/**
 * @typedef {{
 *   id: string,
 *   titleKey: string,
 *   helpKey: string,
 *   value: string | null,
 *   emptyKey?: string | null,
 *   statusKey: string | null,
 *   statusLabel: string | null,
 *   whyKeys: string[],
 *   fixKeys: string[],
 *   subScores?: { labelKey: string, value: string }[],
 *   extraLine?: { key: string, params?: Record<string, string | number> },
 * }} ProfileDetailScore
 */

const HEALTH_LEVEL_KEYS = {
  thriving: "health.excellent",
  strengthening: "health.good",
  stable: "health.good",
  balancing: "health.good",
  surviving: "health.caution",
  caution: "health.caution",
  risky: "health.risky",
};

/** Profile score metrics — hero chips, merged primaries, and detail-page rows. */
export function useProfileScoreGuide() {
  const { commitments, lendings, getEffectiveStatus } = useCommitTrack();
  const intel = useCommitIntel();
  const stable = useStabilityIntel();
  const nwIntel = useNetWorthIntel();
  const hub = useProfileHubIntel();

  return useMemo(() => {
    const health = intel.health;
    const survival = stable.survival;
    const survivalMonths =
      survival?.survivalMonths != null ? Math.min(99, Math.round(survival.survivalMonths)) : null;
    const emergencyPct = hub.emergency?.progressPercent;
    const debt = nwIntel.debtHealth;
    const controlScore = computeControlScore(commitments, getEffectiveStatus);

    const avgLendingTrust =
      lendings?.length > 0
        ? Math.round(
            lendings
              .map((l) => trustScoreForLendingEntry(l, lendings))
              .reduce((sum, n) => sum + n, 0) / lendings.length,
          )
        : null;

    const emergencyTone =
      hub.emergency?.tier === "on_track" || hub.emergency?.tier === "almost" ? "ok" : "watch";
    const pressureTone =
      intel.stability.score <= 40 ? "ok" : intel.stability.score <= 70 ? "mid" : "risk";
    const billsTone = hub.overdueCount > 0 ? "risk" : hub.pendingCount > 0 ? "mid" : "ok";
    const healthLabelKey = health?.level
      ? HEALTH_LEVEL_KEYS[health.level] || "health.caution"
      : null;

    const runwayTone =
      survivalMonths != null && survivalMonths >= 6
        ? "ok"
        : survivalMonths != null && survivalMonths >= 3
          ? "mid"
          : "risk";

    /** @type {ProfileDetailScore[]} */
    const detailScores = [
      {
        id: "pressure",
        titleKey: "profileHub.widget.pressure",
        helpKey: "help.pressureScore",
        value: `${intel.stability.score}/100`,
        statusKey: null,
        statusLabel: intel.stability.label,
        whyKeys: buildWhyKeys("pressure", intel.stability.score),
        fixKeys: buildFixKeys("pressure", intel.stability.score, hub.overdueCount),
      },
      {
        id: "health",
        titleKey: "profileHub.widget.health",
        helpKey: "help.healthScore",
        value: health?.score != null ? `${health.score}/100` : "—",
        statusKey: healthLabelKey,
        statusLabel: null,
        whyKeys: buildWhyKeys("health", health?.score ?? 0),
        fixKeys: buildHealthFixKeys(health),
        subScores: [
          { labelKey: "profileHub.scoreSub.control", value: `${controlScore}/100` },
          { labelKey: "netWorth.lifeScore.title", value: `${nwIntel.lifeScore?.score ?? "—"}/100` },
        ],
      },
      {
        id: "runway",
        titleKey: "profileHub.score.runway",
        helpKey: "help.survivalMonths",
        value: survivalMonths != null ? `${survivalMonths} mo` : "—",
        statusKey: null,
        statusLabel: survival?.tierLabel,
        extraLine:
          emergencyPct != null
            ? { key: "profileHub.score.emergencyLine", params: { pct: emergencyPct } }
            : null,
        whyKeys: buildWhyKeys("runway", survivalMonths ?? 0),
        fixKeys: buildFixKeys("runway", survivalMonths ?? 0, 0),
      },
      {
        id: "flexibility",
        titleKey: "profileHub.widget.flexibility",
        helpKey: "help.freeCash",
        value:
          nwIntel.liquidity?.flexibilityScore != null
            ? `${nwIntel.liquidity.flexibilityScore}/100`
            : "—",
        statusKey: null,
        statusLabel: null,
        whyKeys: buildWhyKeys("flexibility", nwIntel.liquidity?.flexibilityScore ?? 0),
        fixKeys: ["profileHub.scoreFix.flexibility.reduceBurden", "profileHub.scoreFix.flexibility.trackSpend"],
      },
      {
        id: "debt",
        titleKey: "profileHub.widget.debt",
        helpKey: "help.monthlyBurden",
        value: debt?.emiOverloadPct != null ? `${debt.emiOverloadPct}%` : "—",
        statusKey: debt?.pressureLevel ? `profileHub.debt.${debt.pressureLevel}` : null,
        statusLabel: null,
        whyKeys: buildWhyKeys("debt", 100 - (debt?.emiOverloadPct ?? 0)),
        fixKeys: buildFixKeys("debt", debt?.emiOverloadPct ?? 0, 0),
      },
    ];

    const lendingTrustWhyKeys =
      avgLendingTrust != null
        ? buildWhyKeys("lending", avgLendingTrust)
        : ["profileHub.scoreWhy.lending.what", "profileHub.scoreWhy.lending.empty"];

    detailScores.push({
      id: "lending-trust",
      titleKey: "profileHub.widget.lendingTrust",
      helpKey: "help.lendingFlexible",
      value: avgLendingTrust != null ? `${avgLendingTrust}/100` : null,
      emptyKey: avgLendingTrust == null ? "profileHub.widget.trustEmpty" : null,
      statusKey: null,
      statusLabel: null,
      whyKeys: lendingTrustWhyKeys,
      fixKeys:
        avgLendingTrust != null
          ? ["profileHub.scoreFix.lending.onTime", "profileHub.scoreFix.lending.document"]
          : ["profileHub.scoreFix.lending.addDeals", "profileHub.scoreFix.lending.document"],
    });

    const payoffOrder = (intel.rankedPayoffs || []).slice(0, 6).map((row) => ({
      name: row.commitment?.name,
      amount: Number(row.commitment?.remainingAmount ?? row.commitment?.amount ?? 0),
      dueDate: row.commitment?.dueDate,
    }));

    return {
      heroChips: [
        {
          id: "emergency",
          labelKey: "profileHub.widget.emergency",
          value: emergencyPct != null ? `${emergencyPct}%` : "—",
          tone: emergencyTone,
        },
        {
          id: "pressure",
          labelKey: "profileHub.widget.pressure",
          value: `${intel.stability.score ?? 0}`,
          tone: pressureTone,
        },
        {
          id: "bills",
          labelKey: "profileHub.widget.pending",
          value: `${hub.pendingCount}`,
          subKey: hub.overdueCount > 0 ? "profileHub.widget.pressureOverdue" : null,
          tone: billsTone,
        },
      ],
      avgLendingTrust,
      primary: {
        health: {
          score: health?.score,
          labelKey: healthLabelKey,
          tone: (health?.score ?? 0) >= 70 ? "ok" : (health?.score ?? 0) >= 50 ? "mid" : "risk",
        },
        runway: {
          months: survivalMonths,
          emergencyPct,
          tierLabel: survival?.tierLabel,
          tone: runwayTone,
        },
      },
      detailScores,
      payoffOrder,
      focusFirst: intel.payoffRec,
      freeMoney: intel.freeMoneyAfterBurden,
      narrative: stable.healthNarrative,
      formatFreeMoney: formatInr(Math.max(0, Math.round(intel.freeMoneyAfterBurden))),
    };
  }, [commitments, lendings, getEffectiveStatus, intel, stable, nwIntel, hub]);
}

/** @param {string} id @param {number} score */
function buildWhyKeys(id, score) {
  const keys = [`profileHub.scoreWhy.${id}.what`];
  if (id === "pressure") {
    if (score > 70) keys.push("profileHub.scoreWhy.pressure.high");
    else if (score > 40) keys.push("profileHub.scoreWhy.pressure.mid");
    else keys.push("profileHub.scoreWhy.pressure.low");
  } else if (id === "health") {
    if (score < 55) keys.push("profileHub.scoreWhy.health.low");
    else if (score < 75) keys.push("profileHub.scoreWhy.health.mid");
    else keys.push("profileHub.scoreWhy.health.good");
  } else if (id === "runway") {
    if (score < 3) keys.push("profileHub.scoreWhy.runway.critical");
    else if (score < 6) keys.push("profileHub.scoreWhy.runway.thin");
    else keys.push("profileHub.scoreWhy.runway.ok");
  } else if (id === "flexibility") {
    if (score < 45) keys.push("profileHub.scoreWhy.flexibility.low");
    else keys.push("profileHub.scoreWhy.flexibility.ok");
  } else if (id === "debt") {
    if (score < 50) keys.push("profileHub.scoreWhy.debt.high");
    else keys.push("profileHub.scoreWhy.debt.ok");
  } else if (id === "lending") {
    if (score < 60) keys.push("profileHub.scoreWhy.lending.low");
    else keys.push("profileHub.scoreWhy.lending.ok");
  }
  return keys;
}

/** @param {string} id @param {number} score @param {number} overdueCount */
function buildFixKeys(id, score, overdueCount) {
  const keys = [];
  if (id === "pressure") {
    if (overdueCount > 0) keys.push("profileHub.scoreFix.pressure.clearOverdue");
    if (score > 50) keys.push("profileHub.scoreFix.pressure.trimSubscriptions");
    keys.push("profileHub.scoreFix.pressure.payOnTime");
  } else if (id === "runway") {
    if (score < 6) keys.push("profileHub.scoreFix.runway.buildReserve");
    keys.push("profileHub.scoreFix.runway.reduceBurn");
  } else if (id === "debt") {
    if (score > 35) keys.push("profileHub.scoreFix.debt.attackHighInterest");
    keys.push("profileHub.scoreFix.debt.avoidNewEmi");
  }
  return keys.length ? keys : [`profileHub.scoreFix.${id}.general`];
}

/** @param {import('../engines/financialHealth.js').computeFinancialHealthScore extends Function ? ReturnType<import('../engines/financialHealth.js').computeFinancialHealthScore> : object} [health] */
function buildHealthFixKeys(health) {
  const keys = [];
  if (!health) return ["profileHub.scoreFix.health.general"];
  if (health.burdenScore < 55) keys.push("profileHub.scoreFix.health.reduceBurden");
  if (health.bufferScore < 55) keys.push("profileHub.scoreFix.health.buildBuffer");
  if (health.behaviourScore < 55) keys.push("profileHub.scoreFix.health.payOnTime");
  if (health.trajectoryScore < 55) keys.push("profileHub.scoreFix.health.reduceDebt");
  if (!keys.length) keys.push("profileHub.scoreFix.health.keepGoing");
  return keys;
}
