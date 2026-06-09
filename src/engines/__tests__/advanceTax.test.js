import { describe, it, expect } from "vitest";
import {
  computeAdvanceTaxSchedule,
  buildAdvanceTaxReminders,
  advanceTaxCommitmentDrafts,
} from "../advanceTax.js";

const highIncome = {
  annualGrossIncome: 2_400_000,
  regime: "new",
  deduction80c: 0,
  deduction80d: 0,
};

describe("advanceTax", () => {
  it("skips schedule when tax below threshold", () => {
    const schedule = computeAdvanceTaxSchedule({ annualGrossIncome: 300_000, regime: "new" }, "2026-06-01");
    expect(schedule.required).toBe(false);
    expect(schedule.quarters).toHaveLength(0);
  });

  it("builds four quarterly installments for high liability", () => {
    const schedule = computeAdvanceTaxSchedule(highIncome, "2026-06-01");
    expect(schedule.required).toBe(true);
    expect(schedule.quarters).toHaveLength(4);
    const sum = schedule.quarters.reduce((s, q) => s + q.installmentAmount, 0);
    expect(sum).toBe(schedule.totalTax);
  });

  it("emits reminders for upcoming quarters", () => {
    const reminders = buildAdvanceTaxReminders(highIncome, "2026-05-01");
    expect(reminders.length).toBeGreaterThan(0);
    expect(reminders[0].category).toBe("Tax");
  });

  it("creates commitment drafts", () => {
    const drafts = advanceTaxCommitmentDrafts(highIncome, "2026-06-01");
    expect(drafts).toHaveLength(4);
    expect(drafts[0].repeatType).toBe("none");
  });
});
