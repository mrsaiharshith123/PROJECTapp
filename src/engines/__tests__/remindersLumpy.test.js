import { describe, it, expect } from "vitest";
import { buildLumpyBillHorizonReminders } from "../reminders.js";

describe("buildLumpyBillHorizonReminders", () => {
  it("reminds yearly bills due in ~1–3 months", () => {
    const commitments = [
      {
        id: 1,
        name: "School fees",
        dueDate: "2026-04-15",
        amount: 40000,
        remainingAmount: 40000,
        repeatType: "yearly",
        category: "School",
        status: "pending",
      },
    ];
    const getEff = (c) => c.status;
    const rows = buildLumpyBillHorizonReminders(commitments, getEff, "2026-01-10");
    expect(rows.length).toBe(1);
    expect(rows[0].id).toBe("lumpy-1");
    expect(rows[0].messageKey).toBe("notifications.reminder.lumpyHorizon");
    expect(rows[0].messageParams.repeatType).toBe("yearly");
  });

  it("skips paid bills", () => {
    const commitments = [
      {
        id: 2,
        name: "Ins",
        dueDate: "2026-04-01",
        amount: 10000,
        remainingAmount: 0,
        repeatType: "yearly",
        category: "Insurance",
        status: "paid",
      },
    ];
    const getEff = () => "paid";
    const rows = buildLumpyBillHorizonReminders(commitments, getEff, "2026-01-01");
    expect(rows.length).toBe(0);
  });
});
