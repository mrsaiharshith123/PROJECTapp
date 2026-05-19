import { compareYmd } from "./dates.js";
import { normalizeRepeatType } from "../constants/repeatTypes.js";
import { isCurrentCyclePaid } from "./commitmentPayments.js";

/**
 * @param {{ status?: string, remainingAmount?: number, amount?: number, repeatType?: string, dueDate?: string, endDate?: string, payments?: object[] }} c
 * @param {string} todayStr YYYY-MM-DD
 * @param {object[]} [allCommitments]
 * @returns {"paid" | "upnext" | "pending" | "overdue"}
 */
export function getEffectiveStatus(c, todayStr, allCommitments = []) {
  const endDate = c.endDate || "";
  if (endDate && compareYmd(todayStr, endDate) > 0) {
    return "paid";
  }

  const repeatType = normalizeRepeatType(c.repeatType);
  const remaining = Number(c.remainingAmount ?? c.amount ?? 0);

  if (repeatType !== "none" && isCurrentCyclePaid(c, todayStr, allCommitments)) {
    const dueMonth = (c.dueDate || "").slice(0, 7);
    const nowMonth = todayStr.slice(0, 7);
    if (c.dueDate && dueMonth > nowMonth) {
      return "upnext";
    }
    return "paid";
  }

  if (repeatType === "none" && remaining <= 0) {
    return "paid";
  }
  if (remaining <= 0 && repeatType === "none") {
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
 * @param {object[]} [allCommitments]
 */
export function normalizeCommitmentStatusForSave(c, todayStr, allCommitments = []) {
  const effective = getEffectiveStatus(c, todayStr, allCommitments);
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
