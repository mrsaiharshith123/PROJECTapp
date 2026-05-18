import { addMonths, format, parseISO } from "date-fns";
import {
  chitInstallment,
  deriveChitCurrentMonth,
  DEFAULT_FOREMAN_PCT,
} from "../engines/chitFund.js";

export const CHIT_FUND_CATEGORY = "Chit Fund";

export function emptyChitFundFields() {
  return {
    chitValue: "",
    chitMonths: "",
    chitCurrentMonth: "1",
    chitForemanPct: String(DEFAULT_FOREMAN_PCT),
    chitTaken: false,
    chitTakenAtMonth: "",
    chitTakenDiscount: "",
  };
}

export function categoryIsChitFund(categoryId) {
  return categoryId === CHIT_FUND_CATEGORY;
}

/** End date = last installment month from start. */
export function chitEndDateFromStart(startDateYmd, totalMonths) {
  if (!startDateYmd) return "";
  const N = Math.max(1, Math.floor(Number(totalMonths) || 1));
  try {
    const end = addMonths(parseISO(`${startDateYmd}T12:00:00`), N - 1);
    return format(end, "yyyy-MM-dd");
  } catch {
    return "";
  }
}

export { deriveChitCurrentMonth };

export function syncChitAmountFromFields(fields) {
  const V = Number(fields.chitValue) || 0;
  const N = Math.floor(Number(fields.chitMonths) || 0);
  const m = Math.floor(Number(fields.chitCurrentMonth) || 1);
  if (V <= 0 || N <= 0) return "";
  return String(Math.round(chitInstallment(V, N, m)));
}

export function chitFundHasRequiredFields(form) {
  const V = Number(form.chitValue) || 0;
  const N = Math.floor(Number(form.chitMonths) || 0);
  const m = Math.floor(Number(form.chitCurrentMonth) || 0);
  return V > 0 && N >= 1 && m >= 1 && m <= N;
}

export function chitFieldsFromCommitment(c) {
  return {
    chitValue: c.chitValue != null ? String(c.chitValue) : "",
    chitMonths: c.chitMonths != null ? String(c.chitMonths) : "",
    chitCurrentMonth: c.chitCurrentMonth != null ? String(c.chitCurrentMonth) : "1",
    chitForemanPct: c.chitForemanPct != null ? String(c.chitForemanPct) : String(DEFAULT_FOREMAN_PCT),
    chitTaken: Boolean(c.chitTaken),
    chitTakenAtMonth: c.chitTakenAtMonth != null ? String(c.chitTakenAtMonth) : "",
    chitTakenDiscount: c.chitTakenDiscount != null ? String(c.chitTakenDiscount) : "",
  };
}

/** Keep amount, repeat, and end date aligned when editing chit fields. */
export function applyChitFormSync(form) {
  if (!categoryIsChitFund(form.category)) return form;
  const synced = syncChitAmountFromFields(form);
  const end =
    form.startDate && form.chitMonths ? chitEndDateFromStart(form.startDate, form.chitMonths) : form.endDate;
  return {
    ...form,
    repeatType: "monthly",
    ...(synced ? { amount: synced } : {}),
    ...(end ? { endDate: end } : {}),
  };
}

export function buildChitPayloadFromForm(form) {
  const V = Math.max(0, Number(form.chitValue) || 0);
  const N = Math.max(1, Math.floor(Number(form.chitMonths) || 1));
  const m = Math.min(N, Math.max(1, Math.floor(Number(form.chitCurrentMonth) || 1)));
  const amount = Math.round(chitInstallment(V, N, m));
  const foreman = Math.min(15, Math.max(0, Number(form.chitForemanPct) || DEFAULT_FOREMAN_PCT));
  return {
    chitValue: V,
    chitMonths: N,
    chitCurrentMonth: m,
    chitForemanPct: foreman,
    chitTaken: Boolean(form.chitTaken),
    chitTakenAtMonth:
      form.chitTaken && form.chitTakenAtMonth !== ""
        ? Math.min(N, Math.max(1, Math.floor(Number(form.chitTakenAtMonth))))
        : null,
    chitTakenDiscount:
      form.chitTaken && form.chitTakenDiscount !== ""
        ? Math.max(0, Number(form.chitTakenDiscount) || 0)
        : null,
    amount,
    repeatType: "monthly",
    endDate: chitEndDateFromStart(form.startDate, N) || form.endDate || "",
  };
}
