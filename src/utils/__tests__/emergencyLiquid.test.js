import { describe, expect, it } from "vitest";
import { resolveEmergencyLiquidPool } from "../emergencyLiquid.js";

describe("resolveEmergencyLiquidPool", () => {
  it("prefers liquid-tier assets over legacy settings field", () => {
    const pool = resolveEmergencyLiquidPool(
      { liquidSavings: 5000 },
      [{ id: "1", kind: "asset", categoryId: "savings", name: "HDFC", value: 80000 }],
    );
    expect(pool).toBe(80000);
  });

  it("falls back to settings liquidSavings when no assets", () => {
    expect(resolveEmergencyLiquidPool({ liquidSavings: 25000 }, [])).toBe(25000);
  });
});
