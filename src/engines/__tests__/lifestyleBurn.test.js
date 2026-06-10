import { describe, it, expect } from "vitest";
import { resolveDailyLivingCost } from "../lifestyleBurn.js";

describe("resolveDailyLivingCost", () => {
  it("uses national average when city is not set", () => {
    const r = resolveDailyLivingCost({
      settings: { householdScope: "single" },
      dailySpends: [],
      todayStr: "2026-06-01",
    });
    expect(r.source).toBe("national");
    expect(r.dailyInr).toBe(1100);
  });

  it("uses Hyderabad benchmark when no spend logs", () => {
    const r = resolveDailyLivingCost({
      settings: { userCity: "hyderabad", householdScope: "single" },
      dailySpends: [],
      todayStr: "2026-06-01",
    });
    expect(r.source).toBe("city");
    expect(r.dailyInr).toBe(1350);
    expect(r.monthlyInr).toBe(40500);
    expect(r.cityLabel).toBe("Hyderabad");
  });

  it("prefers logged average when enough spend days exist", () => {
    const spends = [];
    for (let d = 15; d <= 24; d++) {
      spends.push({
        id: `s${d}`,
        amount: 500,
        date: `2026-05-${String(d).padStart(2, "0")}`,
      });
    }
    const r = resolveDailyLivingCost({
      settings: { userCity: "mumbai" },
      dailySpends: spends,
      todayStr: "2026-06-01",
      lookbackDays: 30,
    });
    expect(r.source).toBe("logged");
    expect(r.dailyInr).toBe(Math.round(5000 / 30));
  });

  it("scales city benchmark for family household", () => {
    const r = resolveDailyLivingCost({
      settings: { userCity: "hyderabad", householdScope: "family" },
      dailySpends: [],
      todayStr: "2026-06-01",
    });
    expect(r.dailyInr).toBe(Math.round(1350 * 1.55));
  });
});
