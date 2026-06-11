import { describe, expect, it } from "vitest";
import {
  buildCommitmentReminders,
  buildLendingReminders,
  buildSubscriptionEndReminders,
} from "../reminders.js";

describe("buildCommitmentReminders", () => {
  it("includes overdue commitments as critical with messageKey", () => {
    const rows = buildCommitmentReminders(
      [{ id: 1, name: "Rent", amount: 15000, dueDate: "2026-05-01", remainingAmount: 15000, repeatType: "monthly" }],
      () => "overdue",
      "2026-06-10",
    );
    const rent = rows.find((r) => r.id === 1);
    expect(rent?.urgency).toBe("critical");
    expect(rent?.messageKey).toBe("notifications.reminder.overdue");
    expect(rent?.messageParams?.name).toBe("Rent");
  });
});

describe("buildLendingReminders", () => {
  it("flags overdue lending as critical", () => {
    const rows = buildLendingReminders(
      [{ id: "l1", personName: "Ravi", type: "lent", remainingAmount: 5000, dueDate: "2026-06-01" }],
      "2026-06-10",
      () => "overdue",
    );
    expect(rows[0].urgency).toBe("critical");
    expect(rows[0].messageKey).toBe("notifications.reminder.lendingOverdue");
  });
});

describe("buildSubscriptionEndReminders", () => {
  it("reminds before subscription end date", () => {
    const rows = buildSubscriptionEndReminders(
      [{ id: 2, name: "Netflix", category: "Subscription", endDate: "2026-06-13", amount: 649 }],
      "2026-06-10",
    );
    expect(rows.length).toBe(1);
    expect(rows[0].messageKey).toBe("notifications.reminder.subEnd");
  });
});
