import { describe, it, expect } from "vitest";
import { normalizeDashboardToolOrderByMode } from "../dashboardToolOrder.js";

describe("normalizeDashboardToolOrderByMode", () => {
  it("drops freelancer key and merges order into salaried", () => {
    const out = normalizeDashboardToolOrderByMode({
      freelancer: ["bond", "goals"],
      salaried: ["afford"],
    });
    expect(out.freelancer).toBeUndefined();
    expect(out.salaried).toEqual(["afford", "bond", "goals"]);
  });

  it("drops student key", () => {
    const out = normalizeDashboardToolOrderByMode({ student: ["emi"] });
    expect(out.student).toBeUndefined();
    expect(out.salaried).toEqual(["emi"]);
  });
});
