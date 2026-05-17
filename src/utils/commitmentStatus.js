import { compareYmd } from "./dates.js";

/**
 * @param {{ status?: string, remainingAmount?: number, amount?: number, repeatType?: string, dueDate?: string, endDate?: string }} c
 * @param {string} todayStr YYYY-MM-DD
 * @returns {"paid" | "upnext" | "pending" | "overdue"}
 */
export function getEffectiveStatus(c, todayStr) {
  const endDate = c.endDate || "";
  if (endDate && compareYmd(todayStr, endDate) > 0) {
    return "paid";
  }

  const remaining = Number(c.remainingAmount ?? c.amount ?? 0);
  const repeatType = c.repeatType || "none";

  if (c.status === "paid" || (remaining <= 0 && repeatType === "none")) {
    return "paid";
  }
  if (remaining <= 0) {
    return "paid";
  }

  const dueMonth = (c.dueDate || "").slice(0, 7);
  const nowMonth = todayStr.slice(0, 7);
  if (c.dueDate && dueMonth > nowMonth) {
    return "upnext";
  }
  if (c.dueDate && compareYmd(c.dueDate, todayStr) < 0 && remaining > 0) {
    return "overdue";
  }
  return "pending";
}

/**
 * @param {object} c
 * @param {string} todayStr
 */
export function normalizeCommitmentStatusForSave(c, todayStr) {
  const effective = getEffectiveStatus(c, todayStr);
  if (effective === "paid") {
    return { ...c, status: "paid" };
  }
  if (effective === "upnext") {
    return { ...c, status: "upnext" };
  }
  return {
    ...c,
    status: effective === "overdue" ? "overdue" : "pending",
  };
}
