import { describe, it, expect } from "vitest";
import { chitOrganizerRiskScore } from "../chitFund.js";

describe("chitOrganizerRiskScore", () => {
  it("returns null when the user is not the organizer", () => {
    expect(chitOrganizerRiskScore({ chitIsOrganizer: false, chitMembers: [{ name: "A", monthsPaid: 1, monthsDue: 1 }] })).toBeNull();
  });

  it("returns null when there are no members recorded", () => {
    expect(chitOrganizerRiskScore({ chitIsOrganizer: true, chitMembers: [] })).toBeNull();
  });

  it("scores low risk when every member is punctual with no defaults", () => {
    const result = chitOrganizerRiskScore({
      chitIsOrganizer: true,
      chitMembers: [
        { name: "A", monthsPaid: 6, monthsDue: 6, defaulted: false },
        { name: "B", monthsPaid: 6, monthsDue: 6, defaulted: false },
      ],
    });
    expect(result.riskLevel).toBe("low");
    expect(result.defaultRatePct).toBe(0);
    expect(result.atRiskMembers.length).toBe(0);
  });

  it("scores critical risk when a meaningful share of members have defaulted", () => {
    const result = chitOrganizerRiskScore({
      chitIsOrganizer: true,
      chitMembers: [
        { name: "A", monthsPaid: 2, monthsDue: 6, defaulted: true },
        { name: "B", monthsPaid: 3, monthsDue: 6, defaulted: true },
        { name: "C", monthsPaid: 6, monthsDue: 6, defaulted: false },
        { name: "D", monthsPaid: 6, monthsDue: 6, defaulted: false },
      ],
    });
    expect(result.riskLevel).toBe("critical");
    expect(result.defaultRatePct).toBe(50);
    expect(result.atRiskMembers.length).toBe(2);
  });
});
