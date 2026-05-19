import { describe, it, expect } from "vitest";
import { computeLoanEmi } from "../loanEmi.js";

describe("computeLoanEmi", () => {
  it("computes EMI for a typical loan", () => {
    const emi = computeLoanEmi(500000, 10, 60);
    expect(emi).toBeGreaterThan(10000);
    expect(emi).toBeLessThan(12000);
  });
});
