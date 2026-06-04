import { log } from "../utils/logger.js";

export const ACCOUNT_ACTIVITY_KEY = "committrack_account_activity";
export const ACCOUNT_ACTIVITY_EVENT = "committrack:account-activity";

const MAX_STORED = 40;

/**
 * @typedef {'info'|'success'|'warn'|'error'} ActivityLevel
 * @typedef {{ id: string, ts: string, type: string, level: ActivityLevel, message: string, detail?: string }} ActivityEntry
 */

/** @returns {ActivityEntry[]} */
function readStored() {
  try {
    const raw = localStorage.getItem(ACCOUNT_ACTIVITY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStored(entries) {
  try {
    localStorage.setItem(ACCOUNT_ACTIVITY_KEY, JSON.stringify(entries.slice(-MAX_STORED)));
  } catch {
    /* quota — drop oldest */
  }
}

/**
 * @param {{ type: string, message: string, level?: ActivityLevel, detail?: string }} item
 */
export function recordAccountActivity(item) {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: new Date().toISOString(),
    type: item.type,
    level: item.level || "info",
    message: item.message,
    detail: item.detail,
  };

  const next = [...readStored(), entry].slice(-MAX_STORED);
  writeStored(next);

  const logFn = entry.level === "error" ? log.account.error : entry.level === "warn" ? log.account.warn : log.account.info;
  logFn(item.message, { type: item.type, detail: item.detail });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ACCOUNT_ACTIVITY_EVENT, { detail: entry }));
  }

  return entry;
}

/** @returns {ActivityEntry[]} */
export function getAccountActivity(limit = 20) {
  return readStored().slice(-limit).reverse();
}

export function clearAccountActivity() {
  try {
    localStorage.removeItem(ACCOUNT_ACTIVITY_KEY);
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ACCOUNT_ACTIVITY_EVENT, { detail: null }));
  }
}

/**
 * @param {string} event
 * @param {{ email?: string } | null | undefined} user
 * @returns {{ type: string, level: ActivityLevel, message: string } | null}
 */
export function activityFromAuthEvent(event, user) {
  const email = user?.email ? String(user.email) : "";
  const masked = email ? `${email.slice(0, 2)}***@${email.split("@")[1] || ""}` : "your account";

  switch (event) {
    case "SIGNED_IN":
      return { type: "sign_in", level: "success", message: `Signed in as ${masked}` };
    case "SIGNED_OUT":
      return { type: "sign_out", level: "info", message: "Signed out" };
    case "USER_UPDATED":
      return { type: "session", level: "info", message: "Session refreshed" };
    case "PASSWORD_RECOVERY":
      return { type: "password", level: "info", message: "Password recovery started" };
    case "INITIAL_SESSION":
      return user
        ? { type: "session", level: "info", message: "Restored your session" }
        : null;
    default:
      return event
        ? { type: "auth", level: "info", message: `Auth: ${event}` }
        : null;
  }
}
