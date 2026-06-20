import { describe, expect, it } from "vitest";
import { compareSemver } from "../updateServer.js";

describe("compareSemver", () => {
  it("orders versions numerically", () => {
    expect(compareSemver("1.0.1", "1.0.0")).toBeGreaterThan(0);
    expect(compareSemver("1.0.0", "1.0.1")).toBeLessThan(0);
    expect(compareSemver("1.0.0", "1.0.0")).toBe(0);
  });
});
