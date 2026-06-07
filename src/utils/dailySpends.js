import { classifyMerchant } from "./merchantNormalize.js";

/**
 * @typedef {object} DailySpend
 * @property {string} id
 * @property {number} amount
 * @property {string} date
 * @property {string} label
 * @property {string} lifeCategory
 * @property {string} [spendType]
 * @property {string} [merchantId]
 * @property {string} [profileId]
 * @property {string} [source]
 * @property {number} [createdAt]
 */

export function normalizeDailySpend(raw) {
  const amount = Math.max(0, Number(raw.amount) || 0);
  const date = String(raw.date || "").slice(0, 10);
  const label = String(raw.label || raw.merchant || "Spend").trim().slice(0, 80) || "Spend";
  const merchant = classifyMerchant(label, raw.billCategory);
  const lifeCategory =
    raw.lifeCategory && ["survival", "lifestyle", "growth", "pressure", "risk"].includes(raw.lifeCategory)
      ? raw.lifeCategory
      : merchant.lifeCategory;
  return {
    id: String(raw.id || `sp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    amount,
    date,
    label,
    lifeCategory,
    spendType: raw.spendType || merchant.spendType || "other",
    merchantId: raw.merchantId || merchant.id,
    profileId: String(raw.profileId || "default"),
    source: raw.source === "sms" ? "sms" : raw.source === "import" ? "import" : "manual",
    createdAt: Number(raw.createdAt) || Date.now(),
  };
}

export function filterDailySpendsByProfile(spends, profileId = "default") {
  return (spends || []).filter((s) => (s.profileId || "default") === profileId);
}

export function sumDailySpendsInRange(spends, startYmd, endYmd) {
  let sum = 0;
  for (const s of spends || []) {
    if (!s.date || s.date < startYmd || s.date > endYmd) continue;
    sum += Math.max(0, Number(s.amount) || 0);
  }
  return sum;
}

export function dailySpendByLifeCategory(spends, startYmd, endYmd) {
  const map = {};
  for (const s of spends || []) {
    if (!s.date || s.date < startYmd || s.date > endYmd) continue;
    const key = s.lifeCategory || "risk";
    map[key] = (map[key] || 0) + Math.max(0, Number(s.amount) || 0);
  }
  return Object.entries(map)
    .map(([lifeCategory, amount]) => ({ lifeCategory, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function dailySpendByMerchant(spends, startYmd, endYmd) {
  const map = new Map();
  for (const s of spends || []) {
    if (!s.date || s.date < startYmd || s.date > endYmd) continue;
    const key = s.merchantId || s.label;
    const bucket = map.get(key) || { merchantId: key, label: s.label, amount: 0, count: 0 };
    bucket.amount += Math.max(0, Number(s.amount) || 0);
    bucket.count += 1;
    map.set(key, bucket);
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount);
}
