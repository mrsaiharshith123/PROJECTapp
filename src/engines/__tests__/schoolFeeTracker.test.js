import { describe, it, expect } from "vitest";
import { buildSchoolFeeProfile } from "../schoolFeeTracker.js";

describe("buildSchoolFeeProfile", () => {
  it("returns monthlyFees from School category", () => {
    const profile = buildSchoolFeeProfile(
      [
        { category: "School", amount: 5000, repeatType: "monthly", dueDate: "2026-06-15", status: "pending" },
        { category: "EMI", amount: 10000, repeatType: "monthly", dueDate: "2026-06-10", status: "pending" },
      ],
      "2026-06-01",
      () => "pending",
    );
    expect(profile.monthlyFees).toBe(5000);
  });

  it("excludes paid items from upcomingFees", () => {
    const profile = buildSchoolFeeProfile(
      [
        { category: "School", amount: 8000, repeatType: "monthly", dueDate: "2026-06-20", status: "paid" },
        { category: "School", amount: 3000, repeatType: "monthly", dueDate: "2026-06-25", status: "pending" },
      ],
      "2026-06-01",
      (c) => c.status,
    );
    expect(profile.upcomingFees).toHaveLength(1);
    expect(profile.upcomingFees[0].amount).toBe(3000);
  });

  it("annualCalendar has 12 entries", () => {
    const profile = buildSchoolFeeProfile([], "2026-06-01");
    expect(profile.annualCalendar).toHaveLength(12);
  });
});
