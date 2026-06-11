import { describe, expect, it } from "vitest";
import {
  buildSmartPressureNotifications,
  buildNotificationFeed,
  buildContextualReminderFeed,
  unreadCount,
} from "../notifications.js";

const pending = () => "pending";

describe("buildSmartPressureNotifications", () => {
  it("adds lending overdue notification with href", () => {
    const items = buildSmartPressureNotifications({
      commitments: [],
      lendings: [
        {
          personName: "Ravi",
          type: "lent",
          remainingAmount: 5000,
          repaymentSchedule: [{ dueDate: "2026-06-01", paymentStatus: "pending", totalPayment: 2000 }],
        },
      ],
      settings: {},
      income: 80000,
      getEffectiveStatus: pending,
      getEffectiveLendingStatus: () => "overdue",
      todayStr: "2026-06-10",
    });
    const lend = items.find((n) => n.id?.includes("lending-overdue"));
    expect(lend).toBeTruthy();
    expect(lend.href).toBe("/lending");
    expect(lend.messageKey).toBe("notifications.lendingOverdue.messageNamed");
  });
});

describe("buildContextualReminderFeed", () => {
  it("enriches overdue reminders with titleKey and suffix", () => {
    const rows = buildContextualReminderFeed({
      commitments: [
        { id: 1, name: "Rent", amount: 15000, dueDate: "2026-06-10", remainingAmount: 15000, repeatType: "monthly" },
      ],
      lendings: [],
      settings: { monthlyIncome: 80000 },
      getEffectiveStatus: () => "overdue",
      todayStr: "2026-06-10",
    });
    expect(rows[0].titleKey).toBe("notifications.title.overdue");
    expect(rows[0].messageKey).toBe("notifications.reminder.overdue");
  });
});

describe("buildNotificationFeed", () => {
  it("merges contextual reminders and smart pressure items", () => {
    const feed = buildNotificationFeed({
      commitments: [
        { id: 1, name: "Rent", amount: 15000, dueDate: "2026-06-10", remainingAmount: 15000, repeatType: "monthly" },
      ],
      lendings: [],
      settings: { monthlyIncome: 80000, liquidSavings: 50000 },
      getEffectiveStatus: () => "overdue",
      todayStr: "2026-06-10",
      insights: [{ id: "test-warn", tone: "warning" }],
    });
    expect(feed.length).toBeGreaterThan(0);
    expect(feed.some((n) => n.messageKey || n.insightId)).toBe(true);
  });
});

describe("unreadCount", () => {
  it("counts unread items", () => {
    expect(unreadCount([{ read: false }, { read: true }, { read: false }])).toBe(2);
  });
});
