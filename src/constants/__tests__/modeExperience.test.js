import { describe, expect, it } from "vitest";
import { isSalariedFamily, resolveDataProfileScope, getHouseholdModeDisplay } from "../modeExperience.js";

describe("modeExperience family scope", () => {
  it("detects salaried family household", () => {
    expect(isSalariedFamily({ userMode: "salaried", householdScope: "family" })).toBe(true);
    expect(isSalariedFamily({ userMode: "salaried", householdScope: "single" })).toBe(false);
  });

  it("resolveDataProfileScope returns null for family (all profiles)", () => {
    expect(resolveDataProfileScope({ userMode: "salaried", householdScope: "family", activeProfileId: "kid" })).toBe(
      null,
    );
    expect(resolveDataProfileScope({ userMode: "salaried", householdScope: "single", activeProfileId: "kid" })).toBe(
      "kid",
    );
  });

  it("getHouseholdModeDisplay uses family label for household scope", () => {
    expect(getHouseholdModeDisplay({ userMode: "salaried", householdScope: "family" }).labelKey).toBe("mode.family");
    expect(getHouseholdModeDisplay({ userMode: "salaried", householdScope: "single" }).labelKey).toBe("mode.salaried");
  });
});
