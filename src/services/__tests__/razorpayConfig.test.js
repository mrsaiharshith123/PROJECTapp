import { afterEach, describe, expect, it, vi } from "vitest";
import { getTierAnnualPaise, isRazorpayKeyPresent } from "../razorpayConfig.js";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("razorpayConfig", () => {
  it("returns annual paise for paid tiers", () => {
    expect(getTierAnnualPaise("pro")).toBe(79900);
    expect(getTierAnnualPaise("power")).toBe(149900);
    expect(getTierAnnualPaise("free")).toBeNull();
  });

  it("detects real test keys", () => {
    expect(isRazorpayKeyPresent("rzp_test_abc123")).toBe(true);
    expect(isRazorpayKeyPresent("rzp_live_abc123")).toBe(true);
    expect(isRazorpayKeyPresent("rzp_test_xxxx")).toBe(false);
    expect(isRazorpayKeyPresent("")).toBe(false);
  });

  it("disables simulation when razorpay key is configured", async () => {
    vi.stubEnv("VITE_RAZORPAY_KEY_ID", "rzp_test_mykey");
    vi.stubEnv("VITE_SIMULATE_PAYMENTS", "");
    const mod = await import("../razorpayConfig.js");
    expect(mod.isRazorpayConfigured()).toBe(true);
    expect(mod.isPaymentSimulationEnabled()).toBe(false);
  });

  it("enables simulation in dev without key", async () => {
    vi.stubEnv("VITE_RAZORPAY_KEY_ID", "");
    vi.stubEnv("VITE_SIMULATE_PAYMENTS", "");
    const mod = await import("../razorpayConfig.js");
    expect(mod.isPaymentSimulationEnabled()).toBe(Boolean(import.meta.env.DEV));
  });
});
