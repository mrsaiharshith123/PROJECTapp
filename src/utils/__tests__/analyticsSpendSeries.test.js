import { describe, it, expect } from "vitest";
import {
  buildPaymentsWithVariableSeries,
  attachVariableSpendToForecast,
  variableSpendDrilldown,
} from "../analyticsSpendSeries.js";

describe("analyticsSpendSeries", () => {
  it("combines bill payments and variable logs per month", () => {
    const rows = buildPaymentsWithVariableSeries(
      [{ payments: [{ amount: 500, date: "2026-06-10" }] }],
      [{ id: "s1", amount: 200, date: "2026-06-12", label: "Swiggy" }],
      1,
    );
    const june = rows.find((r) => r.monthKey === "2026-06");
    expect(june?.billsPaid).toBe(500);
    expect(june?.variableLogged).toBe(200);
    expect(june?.amount).toBe(700);
  });

  it("reduces forecast free cash when variable spend exists", () => {
    const forecast = attachVariableSpendToForecast(
      [{ monthKey: "2026-06", month: "Jun 26", due: 10000, income: 50000, free: 40000 }],
      [{ id: "s1", amount: 1000, date: "2026-06-05", label: "Uber" }],
    );
    expect(forecast[0].variableSpent).toBe(1000);
    expect(forecast[0].free).toBe(39000);
  });

  it("builds merchant drilldown for a month", () => {
    const drill = variableSpendDrilldown(
      [
        { id: "a", amount: 400, date: "2026-06-02", label: "Swiggy", lifeCategory: "lifestyle", merchantId: "swiggy" },
        { id: "b", amount: 150, date: "2026-06-03", label: "Zomato", lifeCategory: "lifestyle", merchantId: "zomato" },
      ],
      "2026-06",
    );
    expect(drill.total).toBe(550);
    expect(drill.merchants.length).toBeGreaterThan(0);
    expect(drill.entries.length).toBe(2);
  });
});
