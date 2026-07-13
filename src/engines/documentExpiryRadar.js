import { differenceInCalendarDays, parseISO } from "date-fns";
import { todayYmd } from "../utils/dates.js";

/** @typedef {'fd-maturity'|'insurance-renewal'|'vehicle-puc'|'property-tax'|'chit-end'|'rd-maturity'} ExpiryKind */

const RADAR_WINDOW_DAYS = 90;

/**
 * @param {string} dateStr
 * @param {string} todayStr
 */
function daysUntil(dateStr, todayStr) {
  if (!dateStr) return null;
  try {
    return differenceInCalendarDays(parseISO(`${String(dateStr).slice(0, 10)}T12:00:00`), parseISO(`${todayStr}T12:00:00`));
  } catch {
    return null;
  }
}

/**
 * Unified 90-day calendar across every date field already stored across
 * wealth entries and bills — no new data collection for FD/RD/insurance
 * (uses the existing maturityDate field); vehicle PUC and property tax use
 * optional fields that degrade gracefully to "not tracked" when unset.
 * @param {import('../utils/netWorth/wealthStorage.js').WealthEntry[]} wealthEntries
 * @param {object[]} commitments
 * @param {string} [todayStr]
 */
export function scanDocumentExpiry(wealthEntries, commitments, todayStr = todayYmd()) {
  /** @type {{ id: string, kind: ExpiryKind, name: string, dueDate: string, daysUntil: number }[]} */
  const items = [];

  for (const e of wealthEntries || []) {
    if (e.hidden) continue;
    if (e.maturityDate) {
      const kind = e.categoryId === "rd" ? "rd-maturity" : e.categoryId === "insurance" ? "insurance-renewal" : "fd-maturity";
      const d = daysUntil(e.maturityDate, todayStr);
      if (d != null) items.push({ id: `wealth-${e.id}`, kind, name: e.name, dueDate: e.maturityDate, daysUntil: d });
    }
    if (e.pucExpiryDate) {
      const d = daysUntil(e.pucExpiryDate, todayStr);
      if (d != null) items.push({ id: `puc-${e.id}`, kind: "vehicle-puc", name: e.name, dueDate: e.pucExpiryDate, daysUntil: d });
    }
    if (e.propertyTaxDueDate) {
      const d = daysUntil(e.propertyTaxDueDate, todayStr);
      if (d != null) items.push({ id: `tax-${e.id}`, kind: "property-tax", name: e.name, dueDate: e.propertyTaxDueDate, daysUntil: d });
    }
  }

  for (const c of commitments || []) {
    if (c.category !== "Insurance" && c.category !== "Chit Fund") continue;
    const dueDate = c.endDate || c.dueDate;
    if (!dueDate) continue;
    const d = daysUntil(dueDate, todayStr);
    if (d == null) continue;
    items.push({
      id: `bill-${c.id}`,
      kind: c.category === "Chit Fund" ? "chit-end" : "insurance-renewal",
      name: c.name,
      dueDate,
      daysUntil: d,
    });
  }

  const upcoming = items
    .filter((i) => i.daysUntil >= 0 && i.daysUntil <= RADAR_WINDOW_DAYS)
    .sort((a, b) => a.daysUntil - b.daysUntil);
  const overdue = items.filter((i) => i.daysUntil < 0).sort((a, b) => b.daysUntil - a.daysUntil);

  /** @type {'urgent'|'soon'|'clear'} */
  const urgency = upcoming.some((i) => i.daysUntil <= 14) || overdue.length > 0 ? "urgent" : upcoming.length > 0 ? "soon" : "clear";

  return { upcoming, overdue, urgency, windowDays: RADAR_WINDOW_DAYS };
}
