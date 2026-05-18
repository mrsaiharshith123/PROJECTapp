import { describe, expect, it } from "vitest";
import {
  buildChitInstallmentSchedule,
  chitInstallment,
  chitPayout,
  scheduleTotal,
  estimatedDiscountPercent,
} from "../chitFund.js";

describe("chitInstallment", () => {
  it("decreases over months and sums to chit value", () => {
    const V = 500000;
    const N = 20;
    const schedule = buildChitInstallmentSchedule(V, N);
    expect(schedule[0].installment).toBeGreaterThan(schedule[N - 1].installment);
    expect(scheduleTotal(schedule)).toBeCloseTo(V, 0);
  });

  it("month 1 is highest", () => {
    const first = chitInstallment(100000, 10, 1);
    const last = chitInstallment(100000, 10, 10);
    expect(first).toBeGreaterThan(last);
  });
});

describe("chitPayout", () => {
  it("payout is less than full value after discount and foreman", () => {
    const payout = chitPayout(500000, 100000, 5);
    expect(payout).toBeLessThan(500000);
    expect(payout).toBe(375000);
  });
});

describe("estimatedDiscountPercent", () => {
  it("is higher early than late", () => {
    expect(estimatedDiscountPercent(1, 20)).toBeGreaterThan(estimatedDiscountPercent(18, 20));
  });
});
