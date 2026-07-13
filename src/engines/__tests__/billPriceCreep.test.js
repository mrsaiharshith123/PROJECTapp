import { describe, it, expect } from "vitest";
import { billPriceCreepReport } from "../subscriptionLeak.js";

describe("billPriceCreepReport", () => {
  it("flags a bill whose recent payments are meaningfully higher than its earliest payments", () => {
    const commitments = [
      {
        id: "b1",
        name: "Broadband",
        category: "Utility",
        repeatType: "monthly",
        payments: [
          { amount: 1000, date: "2024-01-01" },
          { amount: 1000, date: "2024-02-01" },
          { amount: 1050, date: "2024-03-01" },
          { amount: 1300, date: "2024-04-01" },
          { amount: 1340, date: "2024-05-01" },
          { amount: 1340, date: "2024-06-01" },
        ],
      },
    ];
    const result = billPriceCreepReport(commitments);
    expect(result.hasCreep).toBe(true);
    expect(result.rows[0].id).toBe("b1");
    expect(result.rows[0].creepPct).toBeGreaterThan(12);
  });

  it("does not flag a bill with a stable price history", () => {
    const commitments = [
      {
        id: "b1",
        name: "Rent",
        category: "Rent",
        repeatType: "monthly",
        payments: Array.from({ length: 6 }, (_, i) => ({ amount: 15000, date: `2024-0${i + 1}-01` })),
      },
    ];
    const result = billPriceCreepReport(commitments);
    expect(result.hasCreep).toBe(false);
  });

  it("ignores bills with too little payment history to establish a trend", () => {
    const commitments = [
      {
        id: "b1",
        name: "New bill",
        category: "Utility",
        repeatType: "monthly",
        payments: [{ amount: 1000, date: "2024-01-01" }, { amount: 2000, date: "2024-02-01" }],
      },
    ];
    const result = billPriceCreepReport(commitments);
    expect(result.rows.length).toBe(0);
  });
});
