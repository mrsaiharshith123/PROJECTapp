import { describe, it, expect } from "vitest";
import { totalMonthlyBurden } from "../burden.js";

const active = () => "active";
const bill = (amount, type = "monthly") => ({
  amount,
  repeatType: type,
  startDate: "2024-01-01",
  categoryId: "emi",
});

describe("burden", () => {
  it("sums active monthly commitments", () => {
    const total = totalMonthlyBurden([bill(10000), bill(5000)], active);
    expect(total).toBe(15000);
  });

  it("returns 0 for empty commitments", () => {
    expect(totalMonthlyBurden([], active)).toBe(0);
  });

  it("returns 0 for undefined input", () => {
    expect(totalMonthlyBurden(undefined, active)).toBe(0);
  });

  it("never returns NaN", () => {
    const r = totalMonthlyBurden([bill(NaN)], active);
    expect(Number.isFinite(r)).toBe(true);
  });
});
