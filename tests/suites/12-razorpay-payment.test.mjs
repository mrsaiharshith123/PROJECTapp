import { describe, it, expect } from "vitest";
import { isPaymentSimulationEnabled } from "../../src/services/razorpayConfig.js";
import { TIER_MONTHLY_PAISE, TIER_ANNUAL_PAISE } from "../../src/services/razorpayConfig.js";

describe("Razorpay subscription config", () => {
  it("[P0] tier price tables are positive integers in paise", () => {
    expect(TIER_MONTHLY_PAISE.pro).toBeGreaterThan(0);
    expect(TIER_MONTHLY_PAISE.power).toBeGreaterThan(0);
    expect(TIER_ANNUAL_PAISE.pro).toBeGreaterThan(TIER_MONTHLY_PAISE.pro);
    expect(TIER_ANNUAL_PAISE.power).toBeGreaterThan(TIER_MONTHLY_PAISE.power);
  });

  it("[P1] payment simulation flag is boolean", () => {
    expect(typeof isPaymentSimulationEnabled()).toBe("boolean");
  });
});
