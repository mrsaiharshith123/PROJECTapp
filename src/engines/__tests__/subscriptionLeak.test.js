import { describe, expect, it } from "vitest";
import { subscriptionLeakReport, classifySubscription } from "../subscriptionLeak.js";

const pending = () => "pending";

describe("subscriptionLeakReport", () => {
  it("returns zero monthly equivalent when no subscriptions", () => {
    const r = subscriptionLeakReport(
      [{ category: "Rent", amount: 15000, repeatType: "monthly" }],
      pending
    );
    expect(r.count).toBe(0);
    expect(r.monthlyEquivalent).toBe(0);
  });

  it("returns correct monthly total for multiple subscriptions", () => {
    const r = subscriptionLeakReport(
      [
        { category: "Subscription", name: "Netflix", amount: 649, repeatType: "monthly" },
        { category: "Subscription", name: "Spotify", amount: 119, repeatType: "monthly" },
      ],
      pending
    );
    expect(r.monthlyEquivalent).toBe(768);
    expect(r.count).toBe(2);
  });

  it("includes insights when luxury spend is high", () => {
    const r = subscriptionLeakReport(
      [
        { category: "Subscription", name: "Netflix Premium", amount: 900, repeatType: "monthly", priority: "low" },
        { category: "Subscription", name: "Gaming Pass", amount: 800, repeatType: "monthly", priority: "low" },
      ],
      pending
    );
    const luxuryMonthly = r.classified
      .filter((x) => x.tag === "Luxury" || x.tag === "Optional")
      .reduce((s, x) => s + x.monthly, 0);
    expect(luxuryMonthly).toBeGreaterThan(0);
    expect(r.insights.length).toBeGreaterThan(0);
  });

  it("does not throw on empty commitments array", () => {
    expect(() => subscriptionLeakReport([], pending)).not.toThrow();
    expect(subscriptionLeakReport([], pending).count).toBe(0);
  });
});

describe("classifySubscription", () => {
  it("tags entertainment as luxury", () => {
    expect(classifySubscription({ name: "Netflix", priority: "normal" })).toBe("Luxury");
  });
});
