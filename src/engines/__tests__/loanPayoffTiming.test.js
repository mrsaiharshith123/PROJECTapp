import { describe, expect, it } from "vitest";
import { listDebtSources } from "../loanPayoffTiming.js";

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
});
