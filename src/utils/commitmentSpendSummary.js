import { differenceInCalendarMonths, parseISO } from "date-fns";
import { compareYmd } from "./dates.js";
import { totalPaidOnPayments } from "./commitmentPayments.js";
import { estimatePriorSpend } from "./billLifecycle.js";
import { normalizeRepeatType, repeatIntervalMonths } from "../constants/repeatTypes.js";

function parseYmd(ymd) {
  return parseISO(`${ymd}T12:00:00`);
}

export function isBillEnded(c, todayStr) {
  const end = c.endDate || "";
  return Boolean(end && compareYmd(todayStr, end) > 0);
}

/**
 * Spent to date, estimated future spend until endDate, and totals for bill detail UI.
 */
export function computeBillSpendSummary(c, todayStr) {
  const startDate = c.startDate || c.dueDate || "";
  const endDate = c.endDate || "";
  const amount = Math.max(0, Number(c.amount) || 0);
  const repeatType = c.repeatType || "none";
  const payments = c.payments || [];

  const prior =
    c.priorSpend != null && !Number.isNaN(Number(c.priorSpend))
      ? Math.max(0, Number(c.priorSpend))
      : estimatePriorSpend(c, todayStr);

  const paymentsTracked = payments
    .filter((p) => !startDate || compareYmd(p.date, startDate) >= 0)
    .reduce((s, p) => s + Math.max(0, Number(p.amount) || 0), 0);

  const spentSinceStart = prior + paymentsTracked;
  const spentAllTime = prior + totalPaidOnPayments(payments);
  const ended = isBillEnded(c, todayStr);
  const remaining = Math.max(0, Number(c.remainingAmount ?? amount));

  let futureSpend = null;

  if (endDate && !ended) {
    const from =
      startDate && compareYmd(todayStr, startDate) < 0
        ? startDate
        : compareYmd(todayStr, startDate) >= 0
          ? todayStr
          : startDate || todayStr;

    if (compareYmd(from, endDate) > 0) {
      futureSpend = 0;
    } else {
      const rt = normalizeRepeatType(repeatType);
      const interval = repeatIntervalMonths(rt);
      if (interval > 0) {
        const months = differenceInCalendarMonths(parseYmd(endDate), parseYmd(from)) + 1;
        const cycles =
          rt === "yearly"
            ? Math.max(0, Math.floor(months / 12))
            : Math.max(0, Math.floor(months / interval));
        futureSpend = cycles * amount;
      } else {
        futureSpend = remaining;
      }
    }
  }

  const totalProjected =
    endDate && futureSpend != null ? Math.round(spentSinceStart + futureSpend) : null;

  return {
    startDate,
    endDate,
    priorSpend: Math.round(prior),
    spentSinceStart: Math.round(spentSinceStart),
    spentAllTime: Math.round(spentAllTime),
    futureSpend: futureSpend != null ? Math.round(futureSpend) : null,
    totalProjected,
    ended,
    ongoing: !endDate,
  };
}
