import { describe, it, expect } from "vitest";
import * as engine from "../debtHealth.js";
import { computeDebtHealth } from "../debtHealth.js";
import { lendingMonthlyOutflow } from "../../survival.js";

describe("src/engines/netWorth/debtHealth.js", () => {
  it("loads and exports at least one symbol", () => {
    expect(engine).toBeTruthy();
    expect(Object.keys(engine).length).toBeGreaterThan(0);
  });
});

describe("computeDebtHealth — lending outflow agrees with survival.js", () => {
  const getEffectiveLendingStatus = () => "active";
  const lending = {
    type: "borrowed",
    remainingAmount: 60000,
    repaymentSchedule: [
      { paymentStatus: "pending", totalPayment: 5500 },
      { paymentStatus: "pending", totalPayment: 5500 },
    ],
  };

  it("uses the schedule-based outflow, not the old flat 5%/month heuristic", () => {
    const result = computeDebtHealth({
      liabilityEntries: [],
      commitments: [],
      lendings: [lending],
      monthlyIncome: 80000,
      getEffectiveStatus: () => "active",
      getEffectiveLendingStatus,
      todayStr: "2025-06-01",
    });
    const expectedOutflow = lendingMonthlyOutflow([lending], getEffectiveLendingStatus, "2025-06-01");
    // The flat heuristic would have given 60000 * 0.05 = 3000; the schedule
    // says the next installment is 5500 — these must not silently diverge.
    expect(result.totalEmiLoad).toBe(Math.round(expectedOutflow));
    expect(result.totalEmiLoad).not.toBe(Math.round(60000 * 0.05));
  });

  it("falls back to the flat heuristic when no status resolver is supplied", () => {
    const result = computeDebtHealth({
      liabilityEntries: [],
      commitments: [],
      lendings: [lending],
      monthlyIncome: 80000,
    });
    expect(result.totalEmiLoad).toBe(Math.round(60000 * 0.05));
  });
});
