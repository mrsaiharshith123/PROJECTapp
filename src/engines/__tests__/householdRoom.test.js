import { describe, expect, it } from "vitest";
import { generateHouseholdInviteCode, isValidInviteCode, normalizeInviteCode, householdMemberLimit } from "../householdRoom.js";

describe("householdRoom", () => {
  it("generates 6-char codes", () => {
    const code = generateHouseholdInviteCode();
    expect(code).toHaveLength(6);
    expect(isValidInviteCode(code)).toBe(true);
  });

  it("normalizes invite input", () => {
    expect(normalizeInviteCode(" ab-12c ")).toBe("AB12C");
  });

  it("computes member limit from dependents capped at 6", () => {
    expect(householdMemberLimit({ dependents: 0 })).toBe(2);
    expect(householdMemberLimit({ dependents: 4 })).toBe(6);
    expect(householdMemberLimit({ dependents: 6 })).toBe(6);
  });
});
