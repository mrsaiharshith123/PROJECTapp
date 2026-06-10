import { describe, expect, it } from "vitest";
import { buildSmartPressureNotifications, unreadCount } from "../notifications.js";

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

describe("unreadCount", () => {
  it("counts unread items", () => {
    expect(unreadCount([{ read: false }, { read: true }, { read: false }])).toBe(2);
  });
});
