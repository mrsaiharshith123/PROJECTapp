import { monthlyBurdenForCommitment } from "./burden.js";

const MEMBER_KEYS = ["self", "spouse", "shared", "child"];

/**
 * Aggregate monthly burden + variable spend by household member tag.
 * @param {object[]} commitments
 * @param {object[]} dailySpends
 * @param {string} todayStr
 * @param {(c: object) => string} getEffectiveStatus
 */
export function computeHouseholdSpendBreakdown(commitments, dailySpends, todayStr, getEffectiveStatus) {
  /** @type {Record<string, { bills: number, variable: number }>} */
  const byMember = {};
  for (const key of MEMBER_KEYS) byMember[key] = { bills: 0, variable: 0 };

  for (const c of commitments) {
    if (getEffectiveStatus(c) === "paid") continue;
    const tag = c.forMember && MEMBER_KEYS.includes(c.forMember) ? c.forMember : "shared";
    byMember[tag].bills += monthlyBurdenForCommitment(c, getEffectiveStatus);
  }

  const monthPrefix = todayStr.slice(0, 7);
  for (const s of dailySpends) {
    if (!s?.date?.startsWith(monthPrefix)) continue;
    const tag = s.forMember && MEMBER_KEYS.includes(s.forMember) ? s.forMember : "shared";
    byMember[tag].variable += Math.max(0, Number(s.amount) || 0);
  }

  return MEMBER_KEYS.map((id) => ({
    id,
    bills: byMember[id].bills,
    variable: byMember[id].variable,
    total: byMember[id].bills + byMember[id].variable,
  })).filter((row) => row.total > 0);
}
