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

  it("uses stored member limit when room was created", () => {
    expect(householdMemberLimit({ householdMemberLimit: 4 })).toBe(4);
    expect(householdMemberLimit({ householdMemberLimit: 25 })).toBe(20);
    expect(householdMemberLimit({})).toBe(2);
  });
});
