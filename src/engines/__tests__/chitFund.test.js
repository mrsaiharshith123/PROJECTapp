import { describe, expect, it } from "vitest";
import {
  buildChitInstallmentSchedule,
  chitInstallment,
  chitEqualInstallment,
  chitPayout,
  chitDiscountFromPayout,
  resolveChitInstallment,
  chitCurrentMonthFromMonthsPaid,
  scheduleTotal,
  estimatedDiscountPercent,
} from "../chitFund.js";

describe("chitInstallment", () => {
  it("decreases over months and sums to chit value", () => {
    const V = 500000;
    const N = 20;
    const schedule = buildChitInstallmentSchedule(V, N, "decreasing");
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

describe("equal chit", () => {
  it("5L over 50 months is 10000 per month", () => {
    expect(chitEqualInstallment(500000, 50)).toBe(10000);
    expect(resolveChitInstallment(500000, 50, 47, "equal")).toBe(10000);
  });

  it("months paid 46 means current month 47", () => {
    expect(chitCurrentMonthFromMonthsPaid(46, 50)).toBe(47);
  });

  it("discount from 443k payout on 5L chit", () => {
    const d = chitDiscountFromPayout(500000, 443000, 5);
    expect(d).toBe(32000);
    expect(chitPayout(500000, d, 5)).toBe(443000);
  });
});
