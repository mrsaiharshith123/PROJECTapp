import { addMonths, format, parseISO } from "date-fns";
import {
  deriveChitCurrentMonth,
  DEFAULT_FOREMAN_PCT,
  resolveChitInstallment,
  chitCurrentMonthFromMonthsPaid,
  chitDiscountFromPayout,
  CHIT_INSTALLMENT_MODES,
} from "../engines/chitFund.js";

export const CHIT_FUND_CATEGORY = "Chit Fund";

export { CHIT_INSTALLMENT_MODES };

export function emptyChitFundFields() {
  return {
    chitValue: "",
    chitMonths: "",
    chitMonthsPaid: "",
    chitCurrentMonth: "1",
    chitInstallmentMode: "equal",
    chitCustomInstallment: "",
    chitForemanPct: String(DEFAULT_FOREMAN_PCT),
    chitTaken: false,
    chitTakenAtMonth: "",
    chitTakenPayout: "",
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

function resolveCurrentMonth(fields) {
  const N = Math.floor(Number(fields.chitMonths) || 0);
  if (N <= 0) return 1;
  const paidRaw = fields.chitMonthsPaid;
  if (paidRaw !== "" && paidRaw != null && !Number.isNaN(Number(paidRaw))) {
    return chitCurrentMonthFromMonthsPaid(paidRaw, N);
  }
  return Math.min(N, Math.max(1, Math.floor(Number(fields.chitCurrentMonth) || 1)));
}

export function syncChitAmountFromFields(fields) {
  const V = Number(fields.chitValue) || 0;
  const N = Math.floor(Number(fields.chitMonths) || 0);
  const m = resolveCurrentMonth(fields);
  if (V <= 0 || N <= 0) return "";
  const mode = fields.chitInstallmentMode || "equal";
  const custom =
    mode === "custom"
      ? fields.chitCustomInstallment || fields.amount
      : fields.chitCustomInstallment;
  return String(resolveChitInstallment(V, N, m, mode, custom));
}

export function chitFundHasRequiredFields(form) {
  const V = Number(form.chitValue) || 0;
  const N = Math.floor(Number(form.chitMonths) || 0);
  const m = resolveCurrentMonth(form);
  if (V <= 0 || N < 1 || m < 1 || m > N) return false;
  if (form.chitInstallmentMode === "custom") {
    const custom = Number(form.chitCustomInstallment || form.amount) || 0;
    if (custom <= 0) return false;
  }
  return true;
}

export function chitFieldsFromCommitment(c) {
  const paid =
    c.chitMonthsPaid != null
      ? String(c.chitMonthsPaid)
      : c.chitCurrentMonth != null && Number(c.chitCurrentMonth) > 1
        ? String(Math.max(0, Number(c.chitCurrentMonth) - 1))
        : "";
  return {
    chitValue: c.chitValue != null ? String(c.chitValue) : "",
    chitMonths: c.chitMonths != null ? String(c.chitMonths) : "",
    chitMonthsPaid: paid,
    chitCurrentMonth: c.chitCurrentMonth != null ? String(c.chitCurrentMonth) : "1",
    chitInstallmentMode: c.chitInstallmentMode || "equal",
    chitCustomInstallment:
      c.chitCustomInstallment != null ? String(c.chitCustomInstallment) : c.amount != null ? String(c.amount) : "",
    chitForemanPct: c.chitForemanPct != null ? String(c.chitForemanPct) : String(DEFAULT_FOREMAN_PCT),
    chitTaken: Boolean(c.chitTaken),
    chitTakenAtMonth: c.chitTakenAtMonth != null ? String(c.chitTakenAtMonth) : "",
    chitTakenPayout: c.chitTakenPayout != null ? String(c.chitTakenPayout) : "",
    chitTakenDiscount: c.chitTakenDiscount != null ? String(c.chitTakenDiscount) : "",
  };
}

function syncTakenDiscount(fields) {
  if (!fields.chitTaken) return fields;
  const V = Number(fields.chitValue) || 0;
  const payout = Number(fields.chitTakenPayout) || 0;
  const foreman = Number(fields.chitForemanPct) || DEFAULT_FOREMAN_PCT;
  if (V > 0 && payout > 0) {
    return {
      ...fields,
      chitTakenDiscount: String(chitDiscountFromPayout(V, payout, foreman)),
    };
  }
  return fields;
}

/** Keep amount, month, repeat, and end date aligned when editing chit fields. */
export function applyChitFormSync(form) {
  if (!categoryIsChitFund(form.category)) return form;
  const N = Math.floor(Number(form.chitMonths) || 0);
  let next = { ...form };
  if (N > 0) {
    const m = resolveCurrentMonth(next);
    next.chitCurrentMonth = String(m);
  }
  next = syncTakenDiscount(next);
  const synced = syncChitAmountFromFields(next);
  const end =
    next.startDate && next.chitMonths ? chitEndDateFromStart(next.startDate, next.chitMonths) : next.endDate;
  return {
    ...next,
    repeatType: "monthly",
    ...(synced ? { amount: synced } : {}),
    ...(end ? { endDate: end } : {}),
  };
}

export function buildChitPayloadFromForm(form) {
  const V = Math.max(0, Number(form.chitValue) || 0);
  const N = Math.max(1, Math.floor(Number(form.chitMonths) || 1));
  const m = resolveCurrentMonth(form);
  const mode = form.chitInstallmentMode || "equal";
  const customAmt =
    mode === "custom" ? Math.max(0, Number(form.chitCustomInstallment || form.amount) || 0) : null;
  const amount = resolveChitInstallment(V, N, m, mode, customAmt);
  const foreman = Math.min(15, Math.max(0, Number(form.chitForemanPct) || DEFAULT_FOREMAN_PCT));
  const monthsPaid =
    form.chitMonthsPaid !== "" && form.chitMonthsPaid != null
      ? Math.max(0, Math.floor(Number(form.chitMonthsPaid)))
      : null;
  const payout =
    form.chitTaken && form.chitTakenPayout !== ""
      ? Math.max(0, Number(form.chitTakenPayout) || 0)
      : null;
  const discount =
    form.chitTaken && payout != null && payout > 0
      ? chitDiscountFromPayout(V, payout, foreman)
      : form.chitTaken && form.chitTakenDiscount !== ""
        ? Math.max(0, Number(form.chitTakenDiscount) || 0)
        : null;

  return {
    chitValue: V,
    chitMonths: N,
    chitMonthsPaid: monthsPaid,
    chitCurrentMonth: m,
    chitInstallmentMode: mode,
    chitCustomInstallment: mode === "custom" && customAmt > 0 ? customAmt : null,
    chitForemanPct: foreman,
    chitTaken: Boolean(form.chitTaken),
    chitTakenAtMonth:
      form.chitTaken && form.chitTakenAtMonth !== ""
        ? Math.min(N, Math.max(1, Math.floor(Number(form.chitTakenAtMonth))))
        : null,
    chitTakenPayout: payout,
    chitTakenDiscount: discount,
    amount,
    repeatType: "monthly",
    endDate: chitEndDateFromStart(form.startDate, N) || form.endDate || "",
  };
}

/** Monthly due for a saved commitment row. */
export function getChitMonthlyDue(c) {
  const V = Number(c.chitValue) || 0;
  const N = Math.floor(Number(c.chitMonths) || 0);
  if (V <= 0 || N <= 0) return Math.max(0, Number(c.amount) || 0);
  const m = Math.min(N, Math.max(1, Math.floor(Number(c.chitCurrentMonth) || 1)));
  const mode = c.chitInstallmentMode || "equal";
  const custom = c.chitCustomInstallment ?? c.amount;
  return resolveChitInstallment(V, N, m, mode, custom);
}
