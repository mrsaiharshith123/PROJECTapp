import { describe, expect, it } from "vitest";
import { buildFamilyPressureForecast } from "../familyPressureForecast.js";

describe("buildFamilyPressureForecast", () => {
  it("adds emergency weakness forecast insight", () => {
    const forecast = buildFamilyPressureForecast({
      commitments: [
        { name: "Rent", category: "Rent", remainingAmount: 20000, dueDate: "2026-08-01" },
      ],
      todayStr: "2026-06-14",
      getEffectiveStatus: () => "pending",
      emergencyPct: 25,
    });
    expect(forecast.insights.some((i) => i.id === "family-forecast-emergency-weak")).toBe(true);
  });
});
