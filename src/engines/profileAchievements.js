import { computeGoalProgress } from "./goalsProgress.js";
import { computePaymentMonthStreak } from "../utils/profileStats.js";
import { isHistoryBill } from "../utils/billLifecycle.js";

/**
 * @typedef {object} ProfileAchievement
 * @property {string} id
 * @property {string} source
 * @property {string} label
 * @property {boolean} [labelIsKey]
 * @property {Record<string, string | number>} [labelParams]
 * @property {string} [labelSuffixKey]
 * @property {number} achievedAt
 * @property {string} [type]
 */

/**
 * @param {object} input
 * @param {import('../utils/netWorth/wealthStorage.js').WealthMilestone[]} input.milestones
 * @param {object[]} input.goals
 * @param {object[]} input.commitments
 * @param {object[]} [input.lendings]
 * @param {(c: object, todayStr?: string) => string} input.getEffectiveStatus
 * @param {string} [input.todayStr]
 * @param {object} input.goalCtx
 * @returns {ProfileAchievement[]}
 */
export function buildProfileAchievements(input) {
  /** @type {ProfileAchievement[]} */
  const items = [];

  for (const m of input.milestones || []) {
    items.push({
      id: m.id,
      source: "wealth",
      label: m.labelKey,
      labelIsKey: true,
      achievedAt: m.achievedAt || 0,
      type: m.type,
    });
  }

  for (const g of input.goals || []) {
    const progress = computeGoalProgress(g, input.goalCtx);
    if (progress < 1) continue;
    if (g.archived && g.active === false) {
      items.push({
        id: `goal-${g.id}`,
        source: "goal",
        label: g.title || "Goal",
        achievedAt: Number(g.archivedAt) || Number(g.updatedAt) || Date.now(),
        type: "goal",
      });
    } else if (g.active !== false) {
      items.push({
        id: `goal-live-${g.id}`,
        source: "goal",
        label: g.title || "Goal",
        achievedAt: Number(g.updatedAt) || Date.now(),
        type: "goal",
      });
    }
  }

  for (const c of input.commitments || []) {
    if (!isHistoryBill(c, input.getEffectiveStatus, input.todayStr)) continue;
    const cat = String(c.category || "");
    const isLoan = ["EMI", "Loan", "Credit Card", "BNPL", "Equipment"].includes(cat);
    if (!isLoan) continue;
    items.push({
      id: `bill-${c.id}`,
      source: "debt",
      label: c.name || cat,
      labelSuffixKey: "profileHub.achievement.loanCleared",
      achievedAt: Number(c.updatedAt) || Number(c.paidAt) || Date.now(),
      type: "debt",
    });
  }

  const streak = computePaymentMonthStreak(input.commitments || [], input.lendings || []);
  if (streak >= 2) {
    items.push({
      id: `streak-${streak}`,
      source: "streak",
      label: "profileHub.achievement.paymentStreak",
      labelIsKey: true,
      labelParams: { months: streak },
      achievedAt: Date.now(),
      type: "streak",
    });
  }

  const seen = new Set();
  return items
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort((a, b) => b.achievedAt - a.achievedAt);
}
