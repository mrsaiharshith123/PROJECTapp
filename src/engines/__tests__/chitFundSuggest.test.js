import { describe, expect, it } from "vitest";
import { suggestMaxAcceptableLoss } from "../chitFund.js";

const getStatus = (c) => c.status || "pending";

describe("suggestMaxAcceptableLoss", () => {
  it("lowers cap when burden is high", () => {
    const stressed = suggestMaxAcceptableLoss({
      chitValue: 500000,
      monthlyIncome: 50000,
      commitments: [
        { amount: 40000, repeatType: "monthly", remainingAmount: 40000, status: "pending" },
      ],
      getEffectiveStatus: getStatus,
    });
    const calm = suggestMaxAcceptableLoss({
      chitValue: 500000,
      monthlyIncome: 200000,
      commitments: [
        { amount: 30000, repeatType: "monthly", remainingAmount: 30000, status: "pending" },
      ],
      getEffectiveStatus: getStatus,
    });
    expect(stressed.maxLoss).toBeLessThan(calm.maxLoss);
    expect(stressed.maxLossPercent).toBeLessThan(calm.maxLossPercent);
  });
});
