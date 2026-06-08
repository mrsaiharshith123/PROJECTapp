import { isHistoryBill } from "../../utils/billLifecycle.js";

/** Bill categories that represent outstanding debt. */
const LIABILITY_BILL_CATEGORIES = new Set(["EMI", "Loan", "Credit Card", "BNPL", "Equipment"]);

/** Bill categories treated as investable / semi-liquid assets when balance is tracked. */
const ASSET_BILL_CATEGORIES = new Set(["SIP", "Chit Fund"]);

/** @param {string} billCategory @param {string} [name] */
export function mapBillCategoryToLiabilityId(billCategory, name = "") {
  const n = String(name || "").toLowerCase();
  if (billCategory === "Credit Card") return "credit_card";
  if (billCategory === "BNPL") return "bnpl";
  if (billCategory === "Equipment") return "vehicle_loan";
  if (billCategory === "EMI" || billCategory === "Loan") {
    if (/home|house|mortgage|property|flat|apartment/.test(n)) return "home_loan";
    if (/car|auto|vehicle|bike|scooter/.test(n)) return "vehicle_loan";
    if (/education|student/.test(n)) return "education_loan";
    return "personal_loan";
  }
  return "other";
}

/** @param {string} billCategory */
export function mapBillCategoryToAssetId(billCategory) {
  if (billCategory === "SIP") return "sip";
  if (billCategory === "Chit Fund") return "other";
  return "other";
}

/**
 * Derive read-only wealth rows from active bills (by category + remaining balance).
 * @param {object[]} commitments
 * @param {(c: object, todayStr?: string) => string} getEffectiveStatus
 * @param {string} [todayStr]
 */
export function deriveWealthFromCommitments(commitments, getEffectiveStatus, todayStr) {
  /** @type {import('../../utils/netWorth/wealthStorage.js').WealthEntry[]} */
  const liabilities = [];
  /** @type {import('../../utils/netWorth/wealthStorage.js').WealthEntry[]} */
  const assets = [];

  for (const c of commitments || []) {
    if (isHistoryBill(c, getEffectiveStatus, todayStr)) continue;

    const category = String(c.category || "Other");
    const balance = Math.max(0, Number(c.remainingAmount) || 0);
    if (balance <= 0) continue;

    const emi = Math.max(0, Number(c.amount) || 0);
    const rate = Math.max(0, Number(c.interestRate) || 0);
    const base = {
      id: `commitment:${c.id}`,
      name: String(c.name || "").trim() || category,
      value: balance,
      emi: emi || undefined,
      interestRate: rate || undefined,
      hidden: false,
      source: "commitment",
      commitmentId: c.id,
      createdAt: 0,
      updatedAt: 0,
    };

    if (LIABILITY_BILL_CATEGORIES.has(category)) {
      liabilities.push({
        ...base,
        kind: "liability",
        categoryId: mapBillCategoryToLiabilityId(category, c.name),
      });
    } else if (ASSET_BILL_CATEGORIES.has(category)) {
      assets.push({
        ...base,
        kind: "asset",
        categoryId: mapBillCategoryToAssetId(category),
      });
    }
  }

  return { assets, liabilities };
}
