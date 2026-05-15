import { describe, it, expect } from "vitest";
import { evaluateAffordability } from "../affordability.js";

describe("evaluateAffordability", () => {
  it("computes committed percent and free cash", () => {
    const r = evaluateAffordability(100000, 30000, 10000);
    expect(r.committedPercent).toBe(40);
    expect(r.freeMoneyAfter).toBe(60000);
    expect(r.tier).toBe("safe");
  });

  it("flags high pressure when burden is large", () => {
    const r = evaluateAffordability(50000, 40000, 5000);
    expect(r.tier).toBe("dangerous");
  });
});
