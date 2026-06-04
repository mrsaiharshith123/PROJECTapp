import { describe, it, expect } from "vitest";
import {
  normalizeDashboardToolOrderByMode,
  remapLegacyToolOrderIds,
  orderDashboardWidgets,
} from "../dashboardToolOrder.js";

describe("normalizeDashboardToolOrderByMode", () => {
  it("drops freelancer key and merges order into salaried", () => {
    const out = normalizeDashboardToolOrderByMode({
      freelancer: ["bond", "goals"],
      salaried: ["afford"],
    });
    expect(out.freelancer).toBeUndefined();
    expect(out.salaried).toEqual(["planner", "bond"]);
  });

  it("drops student key", () => {
    const out = normalizeDashboardToolOrderByMode({ student: ["emi"] });
    expect(out.student).toBeUndefined();
    expect(out.salaried).toEqual(["loan"]);
  });

  it("merges legacy tool ids into consolidated tiles", () => {
    expect(remapLegacyToolOrderIds(["afford", "goals", "emi", "payoff"])).toEqual([
      "planner",
      "loan",
    ]);
  });

  it("orderDashboardWidgets applies legacy remap on saved order", () => {
    const defaults = [
      { id: "planner", title: "Plan" },
      { id: "loan", title: "Loan" },
      { id: "incomeTax", title: "Tax" },
    ];
    const ordered = orderDashboardWidgets(defaults, ["goals", "afford", "emi"]);
    expect(ordered.map((w) => w.id)).toEqual(["planner", "loan", "incomeTax"]);
  });
});
