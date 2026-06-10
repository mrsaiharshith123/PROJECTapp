import { describe, expect, it } from "vitest";
import { forecastNextMonthBurden, forecastInsights } from "../forecast.js";

describe("forecastNextMonthBurden", () => {
  it("sums monthly recurring bills", () => {
    const r = forecastNextMonthBurden(
      [{ name: "Rent", amount: 15000, repeatType: "monthly", dueDate: "2026-06-05" }],
      "2026-06-10",
    );
    expect(r.total).toBe(15000);
    expect(r.itemNames).toContain("Rent");
  });
});

describe("forecastInsights", () => {
  it("returns id/tone insight objects", () => {
    const rows = forecastInsights(
      [
        { name: "A", amount: 10000, repeatType: "monthly", dueDate: "2026-06-01" },
        { name: "B", amount: 10000, repeatType: "monthly", dueDate: "2026-06-02" },
        { name: "C", amount: 10000, repeatType: "monthly", dueDate: "2026-06-03" },
      ],
      "2026-06-10",
    );
    for (const row of rows) {
      expect(row.id).toBeTruthy();
      expect(row.text).toBeUndefined();
    }
  });
});
