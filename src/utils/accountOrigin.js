import { format } from "date-fns";

/**
 * Resolve when this local account started (ms epoch).
 * @param {object} settings
 * @param {{ commitments?: object[], lendings?: object[], wealthEntries?: object[] }} [data]
 */
export function resolveAccountCreatedAt(settings, data = {}) {
  const stored = Number(settings?.accountCreatedAt) || 0;
  if (stored > 0) return stored;

  const stamps = [
    ...(data.commitments || []).map((c) => Number(c.createdAt) || 0),
    ...(data.lendings || []).map((l) => Number(l.createdAt) || 0),
    ...(data.wealthEntries || []).map((e) => Number(e.createdAt) || 0),
  ].filter((n) => n > 0);

  return stamps.length ? Math.min(...stamps) : Date.now();
}

/** @param {number} ms */
export function formatAccountOriginLabel(ms) {
  try {
    return format(new Date(ms), "d MMM yyyy");
  } catch {
    return "";
  }
}

/** @param {number} ms */
export function accountOriginDayKey(ms) {
  try {
    return format(new Date(ms), "yyyy-MM-dd");
  } catch {
    return "";
  }
}
