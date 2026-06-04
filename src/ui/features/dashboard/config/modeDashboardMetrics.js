import { formatInr } from "../../../../constants/symbols.js";
import { getExperienceMode } from "../../../../constants/modeExperience.js";
import { COPY } from "../../../../constants/copy.js";

/**
 * @typedef {{ label: string, value: string, valueClassName?: string, caption?: string, conceptId?: string }} HomeKpi
 */

/**
 * Home KPIs — avoid duplicating the month hero (due, paid, free cash).
 * @returns {HomeKpi[]}
 */
export function getHomeKpiTiles({
  settings,
  commitments,
  streak,
  control,
  overdueCount,
  stable,
}) {
  const mode = getExperienceMode(settings);
  const fam = stable?.family;

  const controlClass =
    control >= 70 ? "ct-hero-metric-success" : control >= 45 ? "" : "ct-hero-metric-warn";

  const tiles = [
    {
      label: "Pay streak",
      value: `${streak} mo`,
      caption: "Months with a payment logged",
      conceptId: "payStreak",
    },
    {
      label: "Bill control",
      value: String(control),
      valueClassName: controlClass,
      caption: "100 = no overdue bills",
      conceptId: "billControl",
    },
    { label: COPY.billsStat, value: String(commitments.length) },
    {
      label: "Overdue",
      value: String(overdueCount),
      valueClassName: overdueCount > 0 ? "ct-hero-metric-warn" : "ct-hero-metric-success",
      caption: overdueCount === 0 ? "All caught up" : "Needs attention",
    },
  ];

  if (mode === "family" && fam) {
    tiles[3] = {
      label: "School fees open",
      value: formatInr(fam.schoolOpen),
      valueClassName: fam.schoolOpen > 0 ? "ct-hero-metric-warn" : "",
      caption: "Education bills still due",
    };
  }

  return tiles;
}
