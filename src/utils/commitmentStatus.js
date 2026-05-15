import { compareYmd } from "./dates.js";

/**
 * @param {{ status?: string, remainingAmount?: number, amount?: number, repeatType?: string, dueDate?: string }} c
 * @param {string} todayStr YYYY-MM-DD
 * @returns {"paid" | "pending" | "overdue"}
 */
export function getEffectiveStatus(c, todayStr) {
  const remaining = Number(c.remainingAmount ?? c.amount ?? 0);
  const repeatType = c.repeatType || "none";

  if (c.status === "paid" || (remaining <= 0 && repeatType === "none")) {
    return "paid";
  }
  if (remaining <= 0 && repeatType !== "none") {
    return "pending";
  }
  if (c.dueDate && compareYmd(c.dueDate, todayStr) < 0 && remaining > 0) {
    return "overdue";
  }
  return "pending";
}

/**
 * Sync stored status for persistence (non-paid rows match overdue/pending).
 * @param {object} c
 * @param {string} todayStr
 */
export function normalizeCommitmentStatusForSave(c, todayStr) {
  const effective = getEffectiveStatus(c, todayStr);
  if (effective === "paid") {
    return { ...c, status: "paid" };
  }
  return {
    ...c,
    status: effective === "overdue" ? "overdue" : "pending",
  };
}
