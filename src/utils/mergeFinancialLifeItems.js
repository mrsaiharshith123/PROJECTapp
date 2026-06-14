/** @typedef {{ id?: string, key?: string, tone?: string, params?: object }} LifeItem */

const TONE_RANK = { action: 4, caution: 3, neutral: 2, positive: 1, calm: 1 };

/**
 * Group journey + net-worth insights so one topic (e.g. emergency) never appears twice.
 * @param {LifeItem[]} journey
 * @param {LifeItem[]} insights
 * @param {number} [max]
 * @param {string[]} [excludeTopics] topic ids to skip (e.g. already shown in hero chips)
 */
export function mergeFinancialLifeItems(journey, insights, max = 5, excludeTopics = []) {
  /** @type {LifeItem[]} */
  const combined = [...(journey || []), ...(insights || [])];
  /** @type {Map<string, LifeItem>} */
  const byTopic = new Map();
  const skip = new Set(excludeTopics);

  for (const item of combined) {
    const topic = topicForItem(item);
    if (skip.has(topic)) continue;
    const prev = byTopic.get(topic);
    if (!prev || toneRank(item.tone) > toneRank(prev.tone)) {
      byTopic.set(topic, item);
    }
  }

  return Array.from(byTopic.values()).slice(0, max);
}

export { topicForItem };

/** @param {LifeItem} item */
function topicForItem(item) {
  const id = String(item.id || "");
  const key = String(item.key || "");

  if (
    id.includes("emergency") ||
    key.includes("emergency") ||
    key.includes("survivalMonths") ||
    key.includes("liquidityStrong")
  ) {
    return "emergency";
  }
  if (id.includes("recurring") || key.includes("recurring")) return "recurring";
  if (id.includes("pressure") || key.includes("pressure")) return "pressure";
  if (id === "streak" || key.includes("savingsStreak")) return "savings-habit";
  if (id.startsWith("liq-") || key.includes("liquidity") || key.includes("flexibility")) return "liquidity";
  if (id.startsWith("debt-") || key.includes("debt") || key.includes("liabilit")) return "debt";
  if (key.includes("lifeThriving") || key.includes("wealthGrowing")) return "life-score";
  return id || key || "misc";
}

/** @param {string | undefined} tone */
function toneRank(tone) {
  return TONE_RANK[/** @type {keyof typeof TONE_RANK} */ (tone)] ?? 0;
}
