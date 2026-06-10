import { describe, expect, it } from "vitest";
import { computeEmergencyFundIntel } from "../emergencyFund.js";

describe("computeEmergencyFundIntel", () => {
  it("recommends higher reserve when pressure is high", () => {
    const high = computeEmergencyFundIntel({ monthlyBurden: 50000, liquidSavings: 10000, pressureScore: 75 });
    const low = computeEmergencyFundIntel({ monthlyBurden: 50000, liquidSavings: 10000, pressureScore: 40 });
    expect(high.recommended).toBeGreaterThan(low.recommended);
    expect(high.messageKey).toMatch(/^emergency\.tier\./);
  });
});
