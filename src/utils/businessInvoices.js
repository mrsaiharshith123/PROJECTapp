import { todayYmd } from "./dates.js";

export const BUSINESS_INVOICES_KEY = "committrack_business_invoices";

export function normalizeBusinessInvoice(raw) {
  const now = Date.now();
  const paid = Boolean(raw.paid || raw.paidAt);
  return {
    id: String(raw.id ?? now),
    profileId: String(raw.profileId || "default"),
    clientName: String(raw.clientName || "").trim() || "Client",
    amount: Math.max(0, Number(raw.amount) || 0),
    dueDate: String(raw.dueDate || "").slice(0, 10),
    paid,
    paidAt: paid ? String(raw.paidAt || raw.dueDate || todayYmd()).slice(0, 10) : "",
    notes: String(raw.notes || ""),
    createdAt: Number(raw.createdAt) || now,
    updatedAt: Number(raw.updatedAt) || now,
  };
}

export function loadBusinessInvoicesFromStorage() {
  try {
    const raw = localStorage.getItem(BUSINESS_INVOICES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((row) => normalizeBusinessInvoice(row));
  } catch {
    return [];
  }
}

export function saveBusinessInvoicesToStorage(list) {
  try {
    localStorage.setItem(BUSINESS_INVOICES_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function isInvoiceOverdue(invoice, todayStr = todayYmd()) {
  if (invoice.paid || !invoice.dueDate) return false;
  return invoice.dueDate < todayStr;
}

export function openInvoiceAmount(invoice) {
  return invoice.paid ? 0 : Math.max(0, Number(invoice.amount) || 0);
}
