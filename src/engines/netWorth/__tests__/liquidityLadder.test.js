import { describe, it, expect } from "vitest";
import { computeLiquidityLadder, liquidityLadderScenario } from "../liquidityLadder.js";

const assets = [
  { id: "a1", categoryId: "bank", name: "Savings", value: 120000 },
  { id: "a2", categoryId: "fd", name: "FD", value: 380000 },
  { id: "a3", categoryId: "gold", name: "Gold", value: 400000 },
  { id: "a4", categoryId: "property_residential", name: "Flat", value: 12000000 },
  { id: "a5", categoryId: "pf_epf", name: "EPF", value: 500000 },
];

describe("computeLiquidityLadder", () => {
  it("buckets instant assets correctly and excludes hidden entries", () => {
    const result = computeLiquidityLadder([...assets, { id: "hidden", categoryId: "bank", name: "Hidden", value: 999999, hidden: true }]);
    const instant = result.ladder.find((r) => r.rung === "instant");
    expect(instant.total).toBe(120000);
    expect(instant.items.map((i) => i.id)).toEqual(["a1"]);
  });

  it("puts FD in the fast rung (penalty-accessible), not instant", () => {
    const result = computeLiquidityLadder(assets);
    const fast = result.ladder.find((r) => r.rung === "fast");
    expect(fast.items.some((i) => i.id === "a2")).toBe(true);
  });

  it("puts property and EPF in the very-slow rung", () => {
    const result = computeLiquidityLadder(assets);
    const verySlow = result.ladder.find((r) => r.rung === "very-slow");
    const ids = verySlow.items.map((i) => i.id);
    expect(ids).toContain("a4");
    expect(ids).toContain("a5");
  });

  it("grand total equals the sum of all visible asset values", () => {
    const result = computeLiquidityLadder(assets);
    expect(result.grandTotal).toBe(120000 + 380000 + 400000 + 12000000 + 500000);
  });
});

describe("liquidityLadderScenario", () => {
  it("'if I needed 5L tomorrow' — reports exact instant/week/quarter coverage", () => {
    const ladder = computeLiquidityLadder(assets);
    const scenario = liquidityLadderScenario(ladder, 500000);
    expect(scenario.instantCoverage).toBe(120000);
    // within7Days = instant(120000) + fast(FD 380000 + gold 400000) = 900000, capped at target
    expect(scenario.weekCoverage).toBe(500000);
    expect(scenario.fullyCoveredWithinQuarter).toBe(true);
    expect(scenario.shortfall).toBe(0);
  });

  it("reports a real shortfall when liquid assets fall short of the target", () => {
    const thin = [{ id: "a1", categoryId: "bank", name: "Savings", value: 50000 }];
    const ladder = computeLiquidityLadder(thin);
    const scenario = liquidityLadderScenario(ladder, 500000);
    expect(scenario.shortfall).toBe(450000);
    expect(scenario.fullyCoveredWithinQuarter).toBe(false);
  });
});
