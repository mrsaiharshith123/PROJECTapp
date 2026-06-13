import { describe, expect, it } from "vitest";
import { listDebtSources, adviseLoanExtraPaymentMonths } from "../loanPayoffTiming.js";

const pending = () => "pending";

describe("loanPayoffTiming", () => {
  it("lists EMI commitments as debt sources", () => {
    const { bills } = listDebtSources(
      [{ id: 1, name: "Home", category: "EMI", amount: 20000, remainingAmount: 500000 }],
      [],
      pending,
      pending,
    );
    expect(bills.length).toBe(1);
    expect(bills[0].name).toBe("Home");
  });

  it("advises light months for extra loan payments", () => {
    const commitment = {
      id: 1,
      name: "Home",
      category: "EMI",
      amount: 20000,
      remainingAmount: 500000,
      dueDate: "2026-06-15",
      repeatType: "monthly",
    };
    const r = adviseLoanExtraPaymentMonths({
      target: { kind: "commitment", raw: commitment },
      commitments: [commitment],
      lendings: [],
      getEffectiveStatus: pending,
      getEffectiveLendingStatus: pending,
      todayStr: "2026-06-10",
      monthlyIncome: 120000,
      liquidSavings: 100000,
      horizonMonths: 6,
    });
    expect(r.rows.length).toBe(6);
    expect(r.suggestedExtra).toBeGreaterThanOrEqual(0);
    expect(r.rows.every((row) => row.loanDue === 20000)).toBe(true);
  });

  it("marks light months when other bills are low even if EMI is high", () => {
    const commitment = {
      id: 1,
      name: "Home",
      category: "EMI",
      amount: 83333,
      remainingAmount: 1581037,
      dueDate: "2026-06-15",
      repeatType: "monthly",
    };
    const heavyBill = {
      id: 2,
      name: "Tax",
      category: "Tax",
      amount: 1500000,
      remainingAmount: 1500000,
      dueDate: "2026-06-15",
      repeatType: "none",
    };
    const r = adviseLoanExtraPaymentMonths({
      target: { kind: "commitment", raw: commitment },
      commitments: [commitment, heavyBill],
      lendings: [],
      getEffectiveStatus: pending,
      getEffectiveLendingStatus: pending,
      todayStr: "2026-06-10",
      monthlyIncome: 3200000,
      horizonMonths: 6,
    });
    const jul = r.rows.find((row) => row.label.startsWith("Jul"));
    expect(jul?.goodForExtra).toBe(true);
    expect(jul?.recommendedExtra).toBeGreaterThan(0);
    expect(r.lightMonths.length).toBeGreaterThan(0);
  });
});
