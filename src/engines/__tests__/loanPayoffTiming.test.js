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
  });
});
