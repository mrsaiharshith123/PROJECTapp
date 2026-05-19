import { addMonths, format, parseISO } from "date-fns";
import { compareYmd, todayYmd } from "./dates.js";
import { commitmentSeriesKey } from "./billLifecycle.js";
import {
  grossObligationInMonth,
  isScheduledInMonth,
  normalizeRepeatType,
  repeatIntervalMonths,
} from "../constants/repeatTypes.js";
import { currentCycleRemainingAmount, totalPaidOnPayments } from "./commitmentPayments.js";
import { isHistoryBill } from "./billLifecycle.js";

function monthKeyFromYmd(ymd) {
  return (ymd || "").slice(0, 7);
}

function enumerateMonthKeys(fromKey, toKey) {
  if (!fromKey || !toKey || fromKey > toKey) return [];
  const keys = [];
  try {
    let d = parseISO(`${fromKey}-01T12:00:00`);
    const end = parseISO(`${toKey}-01T12:00:00`);
    while (d <= end) {
      keys.push(format(d, "yyyy-MM"));
      d = addMonths(d, 1);
    }
  } catch {
    return [];
  }
  return keys;
}

function seriesPayments(allCommitments, c) {
  if (!Array.isArray(allCommitments) || allCommitments.length === 0) {
    return c.payments || [];
  }
  const key = commitmentSeriesKey(c);
  return allCommitments.filter((x) => commitmentSeriesKey(x) === key).flatMap((x) => x.payments || []);
}

function firstPaymentMonthKey(seriesPays) {
  const keys = seriesPays
    .map((p) => monthKeyFromYmd(p.date))
    .filter(Boolean)
    .sort();
  return keys[0] || null;
}

function isCyclePaidInMonth(c, monthKey, seriesPays, todayStr) {
  const gross = grossObligationInMonth(c, monthKey, monthKey.slice(5, 7), todayStr);
  if (gross <= 0) return false;
  let paid = 0;
  for (const p of seriesPays) {
    if ((p.date || "").startsWith(monthKey)) {
      paid += Math.max(0, Number(p.amount) || 0);
    }
  }
  return paid >= gross - 0.01;
}

function sumGrossForMonths(c, monthKeys, todayStr) {
  return monthKeys.reduce((s, mk) => {
    const gross = grossObligationInMonth(c, mk, mk.slice(5, 7), todayStr);
    return s + (gross > 0 ? gross : 0);
  }, 0);
}

/**
 * Full contract ledger from start → end: installments and rupee totals from the start date,
 * including months paid before the user started recording payments in CommitTrack.
 */
export function computeContractPaymentLedger(c, todayStr = todayYmd(), allCommitments = []) {
  const start = c.startDate || c.dueDate || "";
  const end = c.endDate || "";
  const rt = normalizeRepeatType(c.repeatType);
  const perCycle = Math.max(0, Number(c.amount) || 0);
  const seriesPays = seriesPayments(allCommitments, c);
  const paymentEntries = seriesPays.length;
  const paymentAmount = Math.round(totalPaidOnPayments(seriesPays));
  const firstPayKey = firstPaymentMonthKey(seriesPays);

  if (c.category === "Chit Fund" && Number(c.chitMonths) > 0) {
    const total = Math.floor(Number(c.chitMonths));
    const current = Math.floor(Number(c.chitCurrentMonth) || 1);
    const paidMonths = Math.max(0, Math.min(total, current - 1));
    const remaining = Math.max(0, total - paidMonths);
    const totalContractValue = total * perCycle;
    const paidTillNow = paidMonths * perCycle;
    return {
      kind: "chit",
      paymentEntries,
      paymentAmount,
      paidCycles: paidMonths,
      totalCycles: total,
      remainingCycles: remaining,
      paidTillNow: Math.round(paidTillNow),
      remainingToPay: Math.round(remaining * perCycle),
      totalContractValue: Math.round(totalContractValue),
      inferredPriorSpend: Math.max(0, paidTillNow - paymentAmount),
      label:
        remaining > 0
          ? `Paid ${paidMonths} of ${total} chit months · ${remaining} left`
          : `All ${total} chit months completed`,
    };
  }

  if (rt === "none") {
    const totalContractValue = perCycle;
    const paidTillNow = Math.min(totalContractValue, paymentAmount);
    const remainingToPay = Math.max(0, totalContractValue - paidTillNow);
    const done = remainingToPay <= 0 && paymentEntries > 0;
    return {
      kind: "once",
      paymentEntries,
      paymentAmount,
      paidCycles: done ? 1 : paymentEntries > 0 ? 1 : 0,
      totalCycles: 1,
      remainingCycles: done ? 0 : 1,
      paidTillNow: Math.round(paidTillNow),
      remainingToPay: Math.round(remainingToPay),
      totalContractValue: Math.round(totalContractValue),
      inferredPriorSpend: 0,
      label: done ? "Paid in full" : paymentEntries > 0 ? "Part paid" : "Not paid yet",
    };
  }

  if (!start) {
    return {
      kind: "recurring",
      paymentEntries,
      paymentAmount,
      paidCycles: paymentEntries,
      totalCycles: null,
      remainingCycles: null,
      paidTillNow: paymentAmount,
      remainingToPay: null,
      totalContractValue: null,
      inferredPriorSpend: 0,
      label: `${paymentEntries} payment${paymentEntries === 1 ? "" : "s"} recorded`,
    };
  }

  const startKey = monthKeyFromYmd(start);
  const endKey = end ? monthKeyFromYmd(end) : monthKeyFromYmd(todayStr);
  const throughKey = end && compareYmd(end, todayStr) < 0 ? endKey : monthKeyFromYmd(todayStr);

  const scheduledMonths = enumerateMonthKeys(startKey, endKey).filter((mk) =>
    isScheduledInMonth(c, mk, todayStr)
  );
  const elapsedMonths = enumerateMonthKeys(startKey, throughKey).filter((mk) =>
    isScheduledInMonth(c, mk, todayStr)
  );

  const totalCycles = scheduledMonths.length;
  const totalContractValue = Math.round(sumGrossForMonths(c, scheduledMonths, todayStr));

  let paidCycles = 0;
  let paidTillNow = 0;
  let inferredPriorSpend = 0;

  for (const mk of elapsedMonths) {
    const gross = grossObligationInMonth(c, mk, mk.slice(5, 7), todayStr);
    if (gross <= 0) continue;

    const paidInMonth = isCyclePaidInMonth(c, mk, seriesPays, todayStr);
    const preTracker = firstPayKey ? mk < firstPayKey : true;

    if (paidInMonth || preTracker) {
      paidCycles += 1;
      paidTillNow += gross;
      if (preTracker && !paidInMonth) {
        inferredPriorSpend += gross;
      }
    }
  }

  if (c.priorSpend != null && !Number.isNaN(Number(c.priorSpend)) && Number(c.priorSpend) > 0) {
    const explicit = Math.max(0, Number(c.priorSpend));
    inferredPriorSpend = explicit;
    paidTillNow = Math.max(paidTillNow, explicit + paymentAmount);
    paidCycles = perCycle > 0 ? Math.min(totalCycles, Math.ceil(paidTillNow / perCycle - 0.001)) : paidCycles;
  }

  let remainingToPay = Math.max(0, totalContractValue - paidTillNow);
  let remainingCycles = Math.max(0, totalCycles - paidCycles);

  const storedRem = Math.max(0, Number(c.remainingAmount ?? 0));
  if (storedRem > remainingToPay + 0.5 && totalContractValue > 0) {
    remainingToPay = storedRem;
    remainingCycles = perCycle > 0 ? Math.min(totalCycles, Math.ceil(storedRem / perCycle - 0.001)) : remainingCycles;
    paidTillNow = Math.max(paymentAmount, totalContractValue - remainingToPay);
    paidCycles = Math.max(paidCycles, totalCycles - remainingCycles);
  }

  paidTillNow = Math.round(paidTillNow);
  remainingToPay = Math.round(remainingToPay);
  inferredPriorSpend = Math.round(Math.max(inferredPriorSpend, paidTillNow - paymentAmount));

  let label;
  if (totalCycles > 0) {
    label =
      remainingCycles > 0
        ? `Paid ${paidCycles} of ${totalCycles} installments · ${remainingCycles} left`
        : `All ${totalCycles} installments paid`;
  } else {
    label = `${paymentEntries} payment${paymentEntries === 1 ? "" : "s"} since ${format(parseISO(`${start}T12:00:00`), "MMM yyyy")}`;
  }

  return {
    kind: "recurring",
    paymentEntries,
    paymentAmount,
    paidCycles,
    totalCycles,
    remainingCycles,
    paidTillNow,
    remainingToPay,
    totalContractValue,
    inferredPriorSpend,
    label,
  };
}

/** @deprecated use computeContractPaymentLedger */
export function computeBillPaymentProgress(c, todayStr = todayYmd(), allCommitments = []) {
  return computeContractPaymentLedger(c, todayStr, allCommitments);
}

/**
 * When a bill is brought back (end date extended, or contract no longer past end), reopen with correct balance.
 */
export function reconcileBillAfterEdit(previous, next, todayStr = todayYmd(), allCommitments = []) {
  let bill = { ...next };
  const nowPastEnd = bill.endDate && compareYmd(todayStr, bill.endDate) > 0;
  if (nowPastEnd) return bill;

  const wasPastEnd = previous.endDate && compareYmd(todayStr, previous.endDate) > 0;
  const endExtended =
    bill.endDate &&
    compareYmd(bill.endDate, todayStr) >= 0 &&
    (!previous.endDate || compareYmd(bill.endDate, previous.endDate) > 0);
  const endRemoved = Boolean(previous.endDate) && !bill.endDate;
  const reactivatedOngoing =
    !bill.endDate && normalizeRepeatType(bill.repeatType) !== "none" && wasPastEnd;
  const wasClosed =
    previous.status === "paid" ||
    isHistoryBill(previous, () => previous.status, todayStr) ||
    (Number(previous.remainingAmount ?? 0) <= 0 && wasPastEnd);

  if (!wasPastEnd && !endExtended && !endRemoved && !wasClosed && !reactivatedOngoing) {
    return bill;
  }

  const rt = normalizeRepeatType(bill.repeatType);
  const perCycle = Math.max(0, Number(bill.amount) || 0);

  if (rt === "none") {
    const rem = currentCycleRemainingAmount(bill, todayStr, allCommitments);
    if (rem > 0) {
      bill = { ...bill, status: "pending", remainingAmount: rem };
    }
    return bill;
  }

  const cycleRem = currentCycleRemainingAmount(bill, todayStr, allCommitments);
  bill = {
    ...bill,
    status: "pending",
    remainingAmount: cycleRem > 0 ? cycleRem : perCycle,
  };

  return bill;
}

/**
 * Remaining balance for a recurring contract (used on save / after payment).
 */
export function contractRemainingAmount(c, todayStr = todayYmd(), allCommitments = []) {
  const ledger = computeContractPaymentLedger(c, todayStr, allCommitments);
  if (ledger.remainingToPay != null) return ledger.remainingToPay;
  const amount = Math.max(0, Number(c.amount) || 0);
  const paid = totalPaidOnPayments(c.payments);
  return Math.max(0, amount - paid);
}
