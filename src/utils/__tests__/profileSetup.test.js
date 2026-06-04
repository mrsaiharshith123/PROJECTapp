import { describe, expect, it } from "vitest";
import {
  isAccountSetupComplete,
  isServerProfileReady,
  setupIncompleteMessage,
  validateOnboardingFields,
} from "../profileSetup.js";

const USER_ID = "11111111-1111-1111-1111-111111111111";

const completeProfile = {
  id: USER_ID,
  display_name: "Asha",
  phone: "9876543210",
  monthly_income: 50000,
  onboarding_complete: true,
};

describe("profileSetup", () => {
  it("requires a complete server profile row", () => {
    expect(isServerProfileReady(completeProfile, USER_ID)).toBe(true);
    expect(
      isAccountSetupComplete(
        { displayName: "A", monthlyIncome: 50000, phoneNumber: "9876543210", onboardingComplete: true },
        null,
        USER_ID,
      ),
    ).toBe(false);
    expect(isAccountSetupComplete({}, completeProfile, USER_ID)).toBe(true);
  });

  it("rejects local-only onboarding flags", () => {
    expect(
      isAccountSetupComplete(
        { displayName: "A", monthlyIncome: 50000, phoneNumber: "9876543210", onboardingComplete: true },
        null,
        USER_ID,
      ),
    ).toBe(false);
  });

  it("validateOnboardingFields does not require onboarding_complete", () => {
    expect(
      validateOnboardingFields(
        { displayName: "A", monthlyIncome: 50000, phoneNumber: "9876543210" },
        { display_name: "A", phone: "9876543210", monthly_income: 50000, onboarding_complete: false },
        USER_ID,
      ),
    ).toBe(null);
    expect(validateOnboardingFields({}, {}, undefined)).toBe("Sign in to continue.");
  });

  it("returns helpful validation messages", () => {
    expect(setupIncompleteMessage({}, null, USER_ID)).toMatch(/no account record/i);
    expect(setupIncompleteMessage({}, completeProfile, USER_ID)).toBe(null);
  });
});
