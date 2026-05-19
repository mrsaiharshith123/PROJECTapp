import { differenceInCalendarMonths, parseISO } from "date-fns";
import { compareYmd } from "./dates.js";
import { totalPaidOnPayments } from "./commitmentPayments.js";
import { commitmentSeriesKey } from "./billLifecycle.js";
import { normalizeRepeatType, repeatIntervalMonths } from "../constants/repeatTypes.js";
import { computeContractPaymentLedger } from "./billPaymentProgress.js";

function parseYmd(ymd) {
  return parseISO(`${ymd}T12:00:00`);
}

export function isBillEnded(c, todayStr) {
  const end = c.endDate || "";
  return Boolean(end && compareYmd(todayStr, end) > 0);
}

function collectSeriesPayments(c, allCommitments) {
  if (!Array.isArray(allCommitments) || allCommitments.length === 0) {
    return c.payments || [];
  }
  const key = commitmentSeriesKey(c);
  return allCommitments
    .filter((x) => commitmentSeriesKey(x) === key)
    .flatMap((x) => x.payments || []);
}

/**
 * Spent to date, estimated future spend until endDate, and totals for bill detail UI.
 * @param {object} c
 * @param {string} todayStr
 * @param {object[]} [allCommitments] all bills (for series payment totals across paid cycles)
 */
export function computeBillSpendSummary(c, todayStr, allCommitments = []) {
  const startDate = c.startDate || c.dueDate || "";
  const endDate = c.endDate || "";
  const amount = Math.max(0, Number(c.amount) || 0);
  const repeatType = c.repeatType || "none";
  const seriesPayments = collectSeriesPayments(c, allCommitments);

  const ledger = computeContractPaymentLedger(c, todayStr, allCommitments);
  const recordedAllTime = Math.round(totalPaidOnPayments(seriesPayments));
  const paymentsTracked = seriesPayments
    .filter((p) => !startDate || compareYmd(p.date, startDate) >= 0)
    .reduce((s, p) => s + Math.max(0, Number(p.amount) || 0), 0);
  const recordedSinceStart = Math.round(paymentsTracked);

  const prior = Math.max(0, ledger.inferredPriorSpend ?? 0);
  const paidTillNow = ledger.paidTillNow ?? prior + recordedSinceStart;
  const remainingToPay =
    ledger.remainingToPay != null ? ledger.remainingToPay : Math.max(0, Number(c.remainingAmount ?? amount));
  const totalContractValue = ledger.totalContractValue;

  const spentSinceStart = paidTillNow;
  const spentAllTime = paidTillNow;
  const ended = isBillEnded(c, todayStr);
  const remaining = remainingToPay;

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
    totalContractValue != null
      ? totalContractValue
      : endDate && futureSpend != null
        ? Math.round(spentSinceStart + futureSpend)
        : null;

  return {
    startDate,
    endDate,
    priorSpend: Math.round(prior),
    recordedSinceStart,
    recordedAllTime,
    paidTillNow: Math.round(paidTillNow),
    remainingToPay: Math.round(remainingToPay),
    totalContractValue: totalContractValue != null ? Math.round(totalContractValue) : null,
    spentSinceStart: Math.round(spentSinceStart),
    spentAllTime: Math.round(spentAllTime),
    futureSpend: futureSpend != null ? Math.round(futureSpend) : null,
    totalProjected,
    ended,
    ongoing: !endDate,
    paidCycles: ledger.paidCycles,
    totalCycles: ledger.totalCycles,
    remainingCycles: ledger.remainingCycles,
  };
}
