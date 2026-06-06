import { describe, expect, it } from "vitest";
import { monthlyBurdenForCommitment, totalMonthlyBurden } from "../burden.js";

const status =
  (map = {}) =>
  (c) =>
    map[c.id] || "pending";

describe("monthlyBurdenForCommitment", () => {
  it("returns 0 for paid or upnext status", () => {
    const c = { id: "1", amount: 5000, repeatType: "monthly" };
    expect(monthlyBurdenForCommitment(c, status({ 1: "paid" }))).toBe(0);
    expect(monthlyBurdenForCommitment(c, status({ 1: "upnext" }))).toBe(0);
  });

  it("returns correct monthly equivalent for bimonthly commitment", () => {
    const c = { id: "b", amount: 6000, repeatType: "bimonthly" };
    expect(monthlyBurdenForCommitment(c, status())).toBe(3000);
  });

  it("divides annual commitment by 12", () => {
    const c = { id: "y", amount: 12000, repeatType: "yearly" };
    expect(monthlyBurdenForCommitment(c, status())).toBe(1000);
  });

  it("returns 0 for zero amount commitment", () => {
    const c = { id: "z", amount: 0, repeatType: "monthly" };
    expect(monthlyBurdenForCommitment(c, status())).toBe(0);
  });
});

describe("totalMonthlyBurden", () => {
  it("sums monthly burden across commitments", () => {
    const list = [
      { id: "a", amount: 10000, repeatType: "monthly" },
      { id: "b", amount: 12000, repeatType: "yearly" },
    ];
    expect(totalMonthlyBurden(list, status())).toBe(11000);
  });

  it("returns 0 for empty list", () => {
    expect(totalMonthlyBurden([], status())).toBe(0);
  });
});
