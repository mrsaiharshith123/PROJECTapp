import { lifeCategoryForBillCategory, getTransactionLifeCategoryMeta } from "../constants/transactionCategories.js";

const KNOWN_MERCHANTS = [
  { pattern: /swiggy/i, profile: { id: "swiggy", label: "Swiggy", lifeCategory: "lifestyle", spendType: "food_delivery" } },
  { pattern: /zomato/i, profile: { id: "zomato", label: "Zomato", lifeCategory: "lifestyle", spendType: "food_delivery" } },
  { pattern: /apollo|fortis|max healthcare/i, profile: { id: "hospital", label: "Healthcare", lifeCategory: "survival", spendType: "medical" } },
  { pattern: /amazon|flipkart|myntra/i, profile: { id: "ecommerce", label: "Online shopping", lifeCategory: "lifestyle", spendType: "shopping" } },
  { pattern: /uber|ola|rapido/i, profile: { id: "ride", label: "Ride / transport", lifeCategory: "lifestyle", spendType: "transport" } },
  { pattern: /netflix/i, profile: { id: "netflix", label: "Netflix", lifeCategory: "lifestyle", spendType: "subscription" } },
  { pattern: /spotify/i, profile: { id: "spotify", label: "Spotify", lifeCategory: "lifestyle", spendType: "subscription" } },
  { pattern: /prime|hotstar|jio\s*cinema/i, profile: { id: "streaming", label: "Streaming", lifeCategory: "lifestyle", spendType: "subscription" } },
  { pattern: /bigbasket|blinkit|zepto/i, profile: { id: "grocery-delivery", label: "Grocery delivery", lifeCategory: "survival", spendType: "groceries" } },
];

export function normalizeMerchantKey(raw) {
  return String(raw || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[^\w\s&.-]/g, "") || "unknown";
}

export function classifyMerchant(name, billCategory) {
  const key = normalizeMerchantKey(name);
  for (const { pattern, profile } of KNOWN_MERCHANTS) {
    if (pattern.test(key) || pattern.test(String(name || ""))) return { ...profile, key };
  }
  const lifeCategory = lifeCategoryForBillCategory(billCategory);
  return {
    id: key.slice(0, 48) || "unknown",
    label: String(name || "Unknown").trim() || "Unknown",
    lifeCategory,
    lifeCategoryLabel: getTransactionLifeCategoryMeta(lifeCategory).label,
    spendType: "other",
    key,
  };
}

export function groupCommitmentsByMerchant(commitments) {
  const map = new Map();
  for (const c of commitments || []) {
    const profile = classifyMerchant(c.name, c.category);
    const bucket = map.get(profile.key) || { profile, commitments: [], monthly: 0 };
    bucket.commitments.push(c);
    bucket.monthly += Math.max(0, Number(c.amount) || 0);
    map.set(profile.key, bucket);
  }
  return [...map.values()].sort((a, b) => b.monthly - a.monthly);
}
