import { describe, it, expect } from "vitest";
import { scanChitFundRedFlags } from "../chitFraudScanner.js";

describe("scanChitFundRedFlags", () => {
  it("flags guaranteed-return language as critical — illegal under the Prize Chits Act", () => {
    const result = scanChitFundRedFlags({ name: "Neighborhood chit", notes: "Guaranteed 15% monthly return, no risk" });
    expect(result.flags.some((f) => f.id === "guaranteed-return")).toBe(true);
    expect(result.riskLevel).toBe("critical");
  });

  it("flags cash-only collection", () => {
    const result = scanChitFundRedFlags({ name: "X", notes: "Cash only, no receipt given", chitRegistrationNumber: "TS-CHIT-00123" });
    expect(result.flags.some((f) => f.id === "cash-only")).toBe(true);
  });

  it("flags a missing registration number and marks it as needing external verification", () => {
    const result = scanChitFundRedFlags({ name: "Vishal chits", notes: "Monthly chit with friends" });
    expect(result.flags.some((f) => f.id === "no-registration-number")).toBe(true);
    expect(result.needsExternalVerification).toBe(true);
  });

  it("flags an implausible placeholder registration number", () => {
    const result = scanChitFundRedFlags({ name: "X", chitRegistrationNumber: "N/A" });
    expect(result.flags.some((f) => f.id === "implausible-registration-number")).toBe(true);
  });

  it("reports low risk for a clean, well-documented chit", () => {
    const result = scanChitFundRedFlags({
      name: "Registered chit",
      notes: "Monthly chit, bid-based discount payout",
      chitOrganizerCompany: "Margadarshi Chit Fund",
      chitRegistrationNumber: "TS/HYD/CHIT/2019/00456",
    });
    expect(result.riskLevel).toBe("low");
    expect(result.flags.length).toBe(0);
  });

  it("flags a missing organizer/company name and marks it as needing external verification", () => {
    const result = scanChitFundRedFlags({
      name: "Vishal chits",
      notes: "Monthly chit with friends",
      chitRegistrationNumber: "TS/HYD/CHIT/2019/00456",
    });
    expect(result.flags.some((f) => f.id === "no-organizer-name")).toBe(true);
    expect(result.needsExternalVerification).toBe(true);
  });

  it("does not flag missing organizer name when a company/organizer is recorded", () => {
    const result = scanChitFundRedFlags({
      name: "X",
      chitOrganizerCompany: "Shriram Chits",
      chitRegistrationNumber: "TS/HYD/CHIT/2019/00456",
    });
    expect(result.flags.some((f) => f.id === "no-organizer-name")).toBe(false);
  });
});
