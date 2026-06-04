import { describe, expect, it } from "vitest";
import { buildProfileUpsertPayload } from "../auth.js";

const UID = "11111111-1111-1111-1111-111111111111";

describe("buildProfileUpsertPayload", () => {
  it("preserves onboarding_complete when patch only updates PAN", () => {
    const out = buildProfileUpsertPayload(
      UID,
      {
        display_name: "Asha",
        phone: "9876543210",
        monthly_income: 50000,
        onboarding_complete: true,
        user_mode: "salaried",
        household_scope: "single",
      },
      { pan: "ABCDE1234F", pan_verified: false },
    );
    expect(out.onboarding_complete).toBe(true);
    expect(out.display_name).toBe("Asha");
    expect(out.monthly_income).toBe(50000);
    expect(out.phone).toBe("9876543210");
    expect(out.pan).toBe("ABCDE1234F");
  });

  it("allows explicit onboarding_complete update", () => {
    const out = buildProfileUpsertPayload(UID, { onboarding_complete: false }, { onboarding_complete: true });
    expect(out.onboarding_complete).toBe(true);
  });
});
