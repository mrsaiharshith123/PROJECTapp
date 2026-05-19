import { describe, it, expect } from "vitest";
import { isActiveBill, isHistoryBill, commitmentSeriesKey } from "../billLifecycle.js";
import { getEffectiveStatus } from "../commitmentStatus.js";

describe("isActiveBill / isHistoryBill", () => {
  it("keeps paid-this-month recurring on active list, not history", () => {
    const c = {
      amount: 199,
      remainingAmount: 0,
      repeatType: "monthly",
      dueDate: "2026-05-10",
      status: "paid",
      payments: [{ amount: 199, date: "2026-05-01" }],
    };
    expect(getEffectiveStatus(c, "2026-05-15")).toBe("paid");
    expect(isActiveBill(c, getEffectiveStatus, "2026-05-15")).toBe(true);
    expect(isHistoryBill(c, getEffectiveStatus, "2026-05-15")).toBe(false);
  });

  it("puts ended one-off in history when fully paid", () => {
    const c = {
      amount: 50000,
      remainingAmount: 0,
      repeatType: "none",
      dueDate: "2025-01-10",
      endDate: "2025-01-10",
      status: "paid",
      payments: [{ amount: 50000, date: "2025-01-05" }],
    };
    expect(isHistoryBill(c, getEffectiveStatus, "2026-05-15")).toBe(true);
    expect(isActiveBill(c, getEffectiveStatus, "2026-05-15")).toBe(false);
  });
});

describe("commitmentSeriesKey", () => {
  it("matches rolled chit rows with same fund", () => {
    const a = { profileId: "default", category: "Chit Fund", name: "My chit", chitValue: 100000, chitMonths: 20 };
    const b = { ...a, id: 2, chitCurrentMonth: 5 };
    expect(commitmentSeriesKey(a)).toBe(commitmentSeriesKey(b));
  });
});
