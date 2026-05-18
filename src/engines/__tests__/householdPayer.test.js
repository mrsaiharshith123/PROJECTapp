import { describe, it, expect } from "vitest";
import { householdPayerInsight, normalizeHouseholdPayer } from "../householdPayer.js";

describe("householdPayer", () => {
  it("normalizes payer tag", () => {
    expect(normalizeHouseholdPayer("PRIMARY")).toBe("primary");
    expect(normalizeHouseholdPayer("")).toBe("");
  });

  it("returns insight when tags used", () => {
    const commitments = [
      {
        id: 1,
        name: "Rent",
        remainingAmount: 20000,
        householdPayer: "primary",
        status: "pending",
      },
      {
        id: 2,
        name: "Sub",
        remainingAmount: 500,
        householdPayer: "secondary",
        status: "pending",
      },
    ];
    const getEff = () => "pending";
    const ins = householdPayerInsight(commitments, getEff, 30000);
    expect(ins).not.toBeNull();
    expect(ins?.text).toContain("primary earner");
    expect(ins?.text).toContain("second income");
  });
});
