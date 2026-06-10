import { describe, expect, it } from "vitest";
import { buildCommitmentReminders } from "../reminders.js";

describe("buildCommitmentReminders", () => {
  it("includes overdue commitments as critical", () => {
    const rows = buildCommitmentReminders(
      [{ id: 1, name: "Rent", amount: 15000, dueDate: "2026-05-01", remainingAmount: 15000 }],
      () => "overdue",
      "2026-06-10",
    );
    expect(rows.some((r) => r.urgency === "critical")).toBe(true);
  });
});
