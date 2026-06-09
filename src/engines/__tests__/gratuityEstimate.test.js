import { describe, it, expect } from "vitest";
import { computeGratuityEstimate } from "../gratuityEstimate.js";

describe("gratuityEstimate", () => {
  it("requires five years", () => {
    expect(computeGratuityEstimate({ lastDrawnMonthlySalary: 50_000, yearsOfService: 3 }).eligible).toBe(false);
  });

  it("estimates gratuity for eligible service", () => {
    const r = computeGratuityEstimate({ lastDrawnMonthlySalary: 60_000, yearsOfService: 8 });
    expect(r.eligible).toBe(true);
    expect(r.estimatedGratuity).toBeGreaterThan(0);
  });
});
