import { differenceInCalendarDays, getDate, parseISO } from "date-fns";
import {
  buildCommitmentReminders,
  buildLendingReminders,
  buildLumpyBillHorizonReminders,
} from "./reminders.js";
import { freeMoneyAfterBurden, computePressureAnalysis } from "./pressureScore.js";
import { combinedMonthlyIncome } from "../utils/combinedIncome.js";
import { buildAdvanceTaxReminders } from "./advanceTax.js";
import { deriveTaxDeductionsFromCommitments } from "./incomeTaxEstimate.js";
import { computeSalaryBreakdown } from "./salaryBreakdown.js";
import { totalMonthlyBurden } from "./burden.js";
import { getOverdueInstallments, computeOverdueTotal } from "./lendingRecovery.js";

/**
 * Context-aware intelligence notifications from pressure drivers.
 */
export function buildSmartPressureNotifications({
  commitments,
  lendings = [],
  settings = /** @type {{ liquidSavings?: number, salaryCreditDay?: number | null }} */ ({}),
  income,
  getEffectiveStatus,
  getEffectiveLendingStatus = undefined,
  monthlySnapshots = [],
  previousScore = null,
  todayStr = "",
}) {
  const analysis = computePressureAnalysis({
    commitments,
    income,
    getEffectiveStatus,
    monthlySnapshots,
    todayStr,
  });

  const items = [];
  const now = Date.now();

  if (previousScore != null && analysis.score - previousScore >= 8) {
    const delta = analysis.score - previousScore;
    const top = analysis.pressureDrivers?.[0];
    const driverPts = top ? Math.min(delta, Math.round(top.points * 0.4)) : delta;
    items.push({
      id: `pressure-jump-${todayStr}`,
      titleKey: "notifications.pressureJump.title",
      messageKey: top ? "notifications.pressureJump.messageWithDriver" : "notifications.pressureJump.message",
      messageParams: top
        ? { delta, category: top.category, driverPts }
        : { delta },
      urgency: "high",
      createdAt: now,
      read: false,
    });
  }

  if (analysis.clusterWeeks?.length > 0) {
    items.push({
      id: `due-cluster-${todayStr}`,
      titleKey: "notifications.dueCluster.title",
      messageKey: "notifications.dueCluster.message",
      urgency: "normal",
      createdAt: now,
      read: false,
    });
  }

  for (const line of analysis.narrativeLines || []) {
    if (line.includes("improving")) {
      items.push({
        id: `pressure-easing-${todayStr}`,
        titleKey: "notifications.pressureEasing.title",
        messageKey: "notifications.pressureEasing.message",
        urgency: "low",
        createdAt: now,
        read: false,
      });
      break;
    }
  }

  const inc = Math.max(0, Number(income) || 0);
  const liquid = Math.max(0, Number(settings.liquidSavings) || 0);
  const burden = totalMonthlyBurden(commitments, getEffectiveStatus);
  const runwayMonths = burden > 0 ? (liquid + Math.max(0, inc - burden)) / burden : null;
  if (runwayMonths != null && runwayMonths < 1.5) {
    items.push({
      id: `low-buffer-${todayStr}`,
      titleKey: "notifications.lowBuffer.title",
      messageKey: "notifications.lowBuffer.message",
      urgency: "high",
      createdAt: now,
      read: false,
    });
  }

  const salaryDay = settings.salaryCreditDay != null ? Number(settings.salaryCreditDay) : null;
  if (salaryDay && todayStr) {
    try {
      const today = parseISO(`${todayStr}T12:00:00`);
      if (getDate(today) === Math.min(31, Math.max(1, salaryDay))) {
        const breakdown = computeSalaryBreakdown(commitments, inc, getEffectiveStatus);
        items.push({
          id: `salary-day-${todayStr}`,
          titleKey: "notifications.salaryDay.title",
          messageKey: "notifications.salaryDay.message",
          messageParams: { amount: Math.round(breakdown.freeCash || 0).toLocaleString("en-IN") },
          urgency: "normal",
          createdAt: now,
          read: false,
        });
      }
    } catch {
      /* ignore invalid date */
    }
  }

  if (getEffectiveLendingStatus && lendings?.length) {
    const overdueLend = lendings.filter((l) => getEffectiveLendingStatus(l, todayStr) === "overdue");
    if (overdueLend.length > 0) {
      const names = overdueLend
        .slice(0, 2)
        .map((l) => l.personName)
        .join(", ");
      const totalOverdue = overdueLend.reduce((sum, l) => sum + computeOverdueTotal(getOverdueInstallments(l)), 0);
      items.push({
        id: `lending-overdue-${todayStr}`,
        titleKey: "notifications.lendingOverdue.title",
        messageKey: names ? "notifications.lendingOverdue.messageNamed" : "notifications.lendingOverdue.message",
        messageParams: {
          count: overdueLend.length,
          names: names || "",
          amount: Math.round(totalOverdue).toLocaleString("en-IN"),
        },
        urgency: "critical",
        createdAt: now,
        read: false,
        href: "/money/lending",
        actionKey: "notifications.lendingMarkPaid",
      });
    }
  }

  return items;
}

/**
 * Enrich reminder messages with amount + free-cash context (feeds in-app + OS notifications).
 */
export function buildContextualReminderFeed({
  commitments,
  lendings,
  settings,
  getEffectiveStatus,
  getEffectiveLendingStatus,
  todayStr,
}) {
  const income = combinedMonthlyIncome(settings);
  const cash = freeMoneyAfterBurden(commitments, income, getEffectiveStatus);

  const autoDed = deriveTaxDeductionsFromCommitments(commitments, getEffectiveStatus);
  const annualGross = income * 12;
  const advanceTax = buildAdvanceTaxReminders(
    {
      annualGrossIncome: annualGross,
      regime: "old",
      deduction80c: autoDed.deduction80c,
      deduction80d: autoDed.deduction80d,
      annualRentPaid: autoDed.annualRentPaid,
    },
    todayStr,
  );

  const base = [
    ...buildCommitmentReminders(commitments, getEffectiveStatus, todayStr),
    ...buildLendingReminders(lendings, todayStr, getEffectiveLendingStatus),
    ...buildLumpyBillHorizonReminders(commitments, getEffectiveStatus, todayStr),
    ...advanceTax,
  ];

  return base.map((r) => {
    const amt = Math.max(0, Number(r.amount) || 0);
    let daysUntil = null;
    try {
      if (r.dueDate) {
        daysUntil = differenceInCalendarDays(parseISO(`${r.dueDate}T12:00:00`), parseISO(`${todayStr}T12:00:00`));
      }
    } catch {
      /* ignore */
    }

    const afterPay = Math.round(cash.freeMoney - amt);
    const dueToday = daysUntil === 0;
    let suffixKey = null;
    /** @type {Record<string, string | number>} */
    const suffixParams = {};
    if (amt > 0 && daysUntil != null && daysUntil >= 0) {
      const amount = amt.toLocaleString("en-IN");
      if (daysUntil === 0) {
        suffixKey =
          income > 0
            ? afterPay >= 0
              ? "notifications.reminder.suffix.amountTodayWithCash"
              : "notifications.reminder.suffix.amountTodayExceeds"
            : "notifications.reminder.suffix.amountToday";
        suffixParams.amount = amount;
        if (income > 0 && afterPay >= 0) suffixParams.afterPay = afterPay.toLocaleString("en-IN");
      } else if (daysUntil <= 7) {
        suffixKey =
          income > 0
            ? afterPay >= 0
              ? "notifications.reminder.suffix.amountInDaysWithCash"
              : "notifications.reminder.suffix.amountInDaysExceeds"
            : "notifications.reminder.suffix.amountInDays";
        suffixParams.amount = amount;
        suffixParams.days = daysUntil;
        if (income > 0 && afterPay >= 0) suffixParams.afterPay = afterPay.toLocaleString("en-IN");
      }
    }

    const titleKey =
      r.urgency === "critical"
        ? "notifications.title.overdue"
        : dueToday
          ? "notifications.title.dueToday"
          : "notifications.title.reminder";

    return {
      ...r,
      titleKey,
      suffixKey,
      suffixParams,
      osBodyKey: "notifications.reminder.osBody",
      osBodyParams: { name: r.name, amount: amt > 0 ? amt.toLocaleString("en-IN") : "" },
      href: r.href || "/ledger/bills",
      actionKey: dueToday ? "notifications.payBillToday" : "notifications.viewBills",
    };
  });
}

function notificationId(r) {
  const id = String(r.id);
  if (id.startsWith("lend-")) return `l-${id}`;
  return `c-${id}`;
}

/**
 * Build in-app notification items from contextual reminders (no push).
 */
export function buildNotificationFeed({
  commitments,
  lendings,
  settings,
  getEffectiveStatus,
  getEffectiveLendingStatus,
  todayStr,
  insights = [],
  readIds = [],
  monthlySnapshots = [],
  previousPressureScore = null,
}) {
  const readSet = new Set(readIds || []);
  const now = Date.now();
  const items = [];

  const contextual = buildContextualReminderFeed({
    commitments,
    lendings,
    settings: settings || {},
    getEffectiveStatus,
    getEffectiveLendingStatus,
    todayStr,
  });

  for (const r of contextual) {
    const nid = notificationId(r);
    items.push({
      id: nid,
      messageKey: r.messageKey,
      messageParams: r.messageParams,
      suffixKey: r.suffixKey,
      suffixParams: r.suffixParams,
      titleKey: r.titleKey,
      osBodyKey: r.osBodyKey,
      osBodyParams: r.osBodyParams,
      urgency: r.urgency,
      dueDate: r.dueDate,
      amount: r.amount,
      createdAt: now,
      read: readSet.has(nid) || readSet.has(String(r.id)),
    });
  }

  const income = combinedMonthlyIncome(settings || {});
  const smart = buildSmartPressureNotifications({
    commitments,
    lendings,
    settings: settings || {},
    income,
    getEffectiveStatus,
    getEffectiveLendingStatus,
    monthlySnapshots,
    previousScore: previousPressureScore,
    todayStr,
  });
  for (const n of smart) {
    items.push({
      ...n,
      read: readSet.has(n.id),
    });
  }

  for (const ins of insights || []) {
    if (ins.tone === "critical" || ins.tone === "warning") {
      const nid = `ins-${ins.id}`;
      items.push({
        id: nid,
        insightId: ins.id,
        insightParams: ins.params,
        titleKey: "notifications.insight.title",
        urgency: ins.tone === "critical" ? "critical" : "high",
        createdAt: now,
        read: readSet.has(nid),
      });
    }
  }

  const order = { critical: 0, high: 1, normal: 2, low: 3 };
  return items.sort((a, b) => (order[a.urgency] ?? 9) - (order[b.urgency] ?? 9));
}

export function unreadCount(notifications) {
  return notifications.filter((n) => !n.read).length;
}
