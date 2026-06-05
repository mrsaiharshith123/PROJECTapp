import { describe, expect, it } from "vitest";
import { generateConfirmationRef, verifyPhoneLast4 } from "../otpConfirmation.js";

describe("otpConfirmation", () => {
  it("generates a 6-char reference", () => {
    const ref = generateConfirmationRef("9876543210", 1234567890);
    expect(ref).toHaveLength(6);
    expect(ref).toMatch(/^[A-Z0-9]+$/);
  });

  it("verifies phone last 4 digits", () => {
    expect(verifyPhoneLast4("9876543210", "3210")).toBe(true);
    expect(verifyPhoneLast4("9876543210", "1234")).toBe(false);
  });
});
