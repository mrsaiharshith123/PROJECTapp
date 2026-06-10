import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getTierAnnualPaise,
  getTierMonthlyPaise,
  getTierPaise,
  isRazorpayKeyPresent,
} from "../razorpayConfig.js";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("razorpayConfig", () => {
  it("returns annual paise for paid tiers", () => {
    expect(getTierAnnualPaise("pro")).toBe(84300);
    expect(getTierAnnualPaise("power")).toBe(169500);
    expect(getTierAnnualPaise("free")).toBeNull();
  });

  it("returns monthly paise when billing is monthly", () => {
    expect(getTierMonthlyPaise("pro")).toBe(9900);
    expect(getTierMonthlyPaise("power")).toBe(19900);
    expect(getTierPaise("pro", "monthly")).toBe(9900);
    expect(getTierPaise("power", "yearly")).toBe(169500);
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
