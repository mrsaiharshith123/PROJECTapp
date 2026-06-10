import { describe, expect, it } from "vitest";
import { buildFamilyExpenseCalendar } from "../familyCalendar.js";

const pending = () => "pending";

describe("buildFamilyExpenseCalendar", () => {
  it("returns month buckets", () => {
    const r = buildFamilyExpenseCalendar(
      [{ name: "School", amount: 5000, repeatType: "monthly", dueDate: "2026-06-10", category: "School" }],
      "2026-06-10",
      pending,
      3,
    );
    expect(r.months?.length).toBeGreaterThan(0);
  });
});
