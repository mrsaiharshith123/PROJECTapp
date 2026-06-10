import { describe, expect, it } from "vitest";
import { commitmentToIncomeRatio, pressureSeverity } from "../pressureAdvanced.js";

const pending = () => "pending";

describe("pressureAdvanced", () => {
  it("computes burden ratio", () => {
    const ratio = commitmentToIncomeRatio(
      [{ amount: 30000, repeatType: "monthly", remainingAmount: 0 }],
      60000,
      pending,
    );
    expect(ratio).toBeCloseTo(0.5, 1);
  });

  it("returns severity band", () => {
    const s = pressureSeverity(
      [{ amount: 50000, repeatType: "monthly", remainingAmount: 0 }],
      60000,
      pending,
    );
    expect(s.level).toBeTruthy();
  });
});
