import { normalizeRepeatType } from "../constants/repeatTypes.js";

/** @type {Record<string, string>} */
const CATEGORY_KEYS = {
  EMI: "category.emi",
  "Credit Card": "category.creditCard",
  Subscription: "category.subscription",
  Insurance: "category.insurance",
  SIP: "category.sip",
  "Chit Fund": "category.chitFund",
  Rent: "category.rent",
  Loan: "category.loan",
  Utility: "category.utility",
  Vendor: "category.vendor",
  Payroll: "category.payroll",
  Software: "category.software",
  Tax: "category.tax",
  Client: "category.client",
  Equipment: "category.equipment",
  School: "category.school",
  Groceries: "category.groceries",
  Education: "category.education",
  Transport: "category.transport",
  Food: "category.food",
  BNPL: "category.bnpl",
  "Family Support": "category.familySupport",
  Other: "category.other",
};

/** @param {(key: string, params?: object) => string} t @param {string} categoryId */
export function translateCategory(t, categoryId) {
  const key = CATEGORY_KEYS[categoryId] || CATEGORY_KEYS.Other;
  return t(key);
}

/** @param {(key: string) => string} t @param {string} priorityId */
export function translatePriority(t, priorityId) {
  const id = priorityId === "high" ? "critical" : priorityId || "medium";
  const key = `priority.${id}`;
  const out = t(key);
  return out === key ? t("priority.medium") : out;
}

/** @param {(key: string) => string} t @param {string} status */
export function translateBillStatus(t, status) {
  const key = `bill.status.${status}`;
  const out = t(key);
  return out === key ? t("bill.status.pending") : out;
}

/** @param {string} repeatType */
export function repeatTypeI18nKey(repeatType) {
  return `repeat.${normalizeRepeatType(repeatType)}`;
}

/** @param {(key: string) => string} t @param {string} repeatType */
export function translateRepeatType(t, repeatType) {
  const key = repeatTypeI18nKey(repeatType);
  const out = t(key);
  return out === key ? repeatType : out;
}

/** @param {(key: string) => string} t @param {string} viewId */
export function translateChartView(t, viewId) {
  const key = `charts.view.${viewId}`;
  const out = t(key);
  return out === key ? viewId : out;
}

/** @param {(key: string) => string} t @param {string} mode */
export function translateRepaymentMode(t, mode) {
  const id = mode || "monthly";
  const key = `lending.repayment.${id}`;
  const out = t(key);
  return out === key ? t("lending.repayment.flexible") : out;
}

/** @param {(key: string) => string} t @param {string} status */
export function translateLendingStatus(t, status) {
  const key = `lending.status.${status}`;
  const out = t(key);
  return out === key ? t("lending.status.pending") : out;
}
