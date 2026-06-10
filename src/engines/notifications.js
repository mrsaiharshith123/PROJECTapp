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
      title: "CommitTrack — pressure change",
      message: `Pressure jumped ${delta} points${top ? ` — ${top.category} commitments contributed ~${driverPts}.` : "."}`,
      urgency: "high",
      createdAt: now,
      read: false,
    });
  }

  if (analysis.clusterWeeks?.length > 0) {
    items.push({
      id: `due-cluster-${todayStr}`,
      title: "CommitTrack — due cluster",
      message: "Three or more commitments are clustering in the same calendar week.",
      urgency: "normal",
      createdAt: now,
      read: false,
    });
  }

  for (const line of analysis.narrativeLines || []) {
    if (line.includes("improving")) {
      items.push({
        id: `pressure-easing-${todayStr}`,
        title: "CommitTrack",
        message: line,
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
      title: "CommitTrack — low reserve",
      message: "Emergency buffer covers less than 6 weeks of bills — consider pausing new commitments.",
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
        const breakdown = computeSalaryBreakdown(commitments, inc, getEffectiveStatus, {
          dailySpends: [],
          todayStr,
        });
        items.push({
          id: `salary-day-${todayStr}`,
          title: "CommitTrack — salary day",
          message: `Salary credited — about ₹${Math.round(breakdown.freeCash || 0).toLocaleString("en-IN")} likely free after scheduled bills this month.`,
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
      items.push({
        id: `lending-overdue-${todayStr}`,
        title: "CommitTrack — lending overdue",
        message: `${overdueLend.length} lending record(s) overdue${names ? ` (${names})` : ""}. Follow up or log a payment.`,
        urgency: "critical",
        createdAt: now,
        read: false,
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
    let detail = "";
    if (amt > 0 && daysUntil != null && daysUntil >= 0) {
      detail = ` ₹${amt.toLocaleString("en-IN")} due`;
      if (daysUntil === 0) detail += " today";
      else if (daysUntil <= 7) detail += ` in ${daysUntil}d`;
      if (income > 0) {
        detail += afterPay >= 0 ? ` · ~₹${afterPay.toLocaleString("en-IN")} left after` : " · may exceed free cash";
      }
    }

    const title =
      r.urgency === "critical" ? "CommitTrack — overdue" : "CommitTrack reminder";

    return {
      ...r,
      title,
      message: `${r.message}${detail}`,
      osBody: `${r.name}:${detail || ` ₹${amt.toLocaleString("en-IN")}`}`.trim(),
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
      message: r.message,
      title: r.title,
      osBody: r.osBody,
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
        message: ins.text,
        title: "CommitTrack",
        osBody: ins.text,
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
