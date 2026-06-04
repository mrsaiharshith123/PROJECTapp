import { differenceInCalendarDays, parseISO } from "date-fns";
import { formatInr, EM_DASH } from "../../../../constants/symbols.js";
import { getExperienceMode } from "../../../../constants/modeExperience.js";

/**
 * @typedef {{ label: string, value: string, valueClassName?: string, caption?: string, conceptId?: string }} HomeKpi
 */

export function dueWithinDays(commitments, getEffectiveStatus, todayStr, days) {
  let sum = 0;
  let count = 0;
  for (const c of commitments) {
    if (getEffectiveStatus(c) === "paid" || !c.dueDate) continue;
    try {
      const d = differenceInCalendarDays(parseISO(`${c.dueDate}T12:00:00`), parseISO(`${todayStr}T12:00:00`));
      if (d >= 0 && d <= days) {
        sum += Math.max(0, Number(c.remainingAmount ?? c.amount) || 0);
        count += 1;
      }
    } catch {
      /* ignore */
    }
  }
  return { sum: Math.round(sum), count };
}

/**
 * Top-of-home KPI row — mode-specific labels (not one salaried grid for all).
 * @returns {HomeKpi[]}
 */
export function getHomeKpiTiles({
  settings,
  monthSummary,
  intel,
  stable,
  commitments,
  getEffectiveStatus,
  todayStr,
}) {
  const mode = getExperienceMode(settings);
  const biz = stable.business;
  const fam = stable.family;

  if (mode === "business" && biz) {
    const week = dueWithinDays(commitments, getEffectiveStatus, todayStr, 7);
    const net = biz.totalReceivables - biz.vendorDue;
    return [
      { label: "Receivables", value: formatInr(biz.totalReceivables), valueClassName: "ct-hero-metric-success", conceptId: "receivables" },
      { label: "Payables due", value: formatInr(biz.vendorDue), valueClassName: "ct-hero-metric-warn", conceptId: "payables" },
      {
        label: "Net position",
        value: formatInr(net),
        valueClassName: net >= 0 ? "ct-hero-metric-success" : "ct-hero-metric-warn",
      },
      {
        label: "Business stability",
        value: `${biz.stabilityScore}%`,
        caption: biz.stabilityLabel,
        conceptId: "businessStability",
      },
      { label: "Due in 7 days", value: formatInr(week.sum), caption: `${week.count} obligation(s)` },
    ].slice(0, 4);
  }

  if (mode === "family" && fam) {
    return [
      { label: "Household due", value: formatInr(monthSummary.dueThisMonth), valueClassName: "ct-hero-metric-warn", conceptId: "burden" },
      {
        label: "Committed",
        value: fam.committedPercent != null ? `${fam.committedPercent}%` : EM_DASH,
        caption: "Of household income",
        conceptId: "pressureScore",
      },
      {
        label: "School fees open",
        value: formatInr(fam.schoolOpen),
        valueClassName: fam.schoolOpen > 0 ? "ct-hero-metric-warn" : "",
      },
      {
        label: "Household safety",
        value: `${fam.familyPressureScore}%`,
        caption: fam.safetyLabel,
        conceptId: "householdSafety",
      },
    ];
  }

  const stabilityScore = intel.stability?.score ?? 0;
  return [
    { label: "Total bills", value: String(commitments.length) },
    { label: "Amount due", value: formatInr(monthSummary.dueThisMonth), valueClassName: "ct-hero-metric-warn", conceptId: "burden" },
    {
      label: mode === "family" ? "Household cash" : "Cash left",
      value:
        monthSummary.freeCash != null
          ? formatInr(monthSummary.freeCash)
          : intel.freeMoneyAfterBurden != null
            ? formatInr(intel.freeMoneyAfterBurden)
            : EM_DASH,
      valueClassName: "ct-hero-metric-success",
      conceptId: "freeCash",
    },
    { label: "Stability", value: `${stabilityScore}%`, conceptId: "stability" },
  ];
}

export function getHomeKpiCaption(settings) {
  const mode = getExperienceMode(settings);
  if (mode === "business") return "Working capital · collection & vendor load";
  if (mode === "family") return "Shared household · education & renewals";
  return "Stability · personal commitments";
}
