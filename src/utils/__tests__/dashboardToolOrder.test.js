import { describe, it, expect } from "vitest";
import { orderDashboardWidgets, normalizeDashboardToolOrderByMode } from "../dashboardToolOrder.js";

describe("orderDashboardWidgets", () => {
  const defaults = [
    { id: "a", title: "A" },
    { id: "b", title: "B" },
    { id: "c", title: "C" },
  ];

  it("returns default order when no saved order", () => {
    expect(orderDashboardWidgets(defaults, undefined).map((x) => x.id)).toEqual(["a", "b", "c"]);
  });

  it("reorders by saved ids and appends missing", () => {
    expect(orderDashboardWidgets(defaults, ["c", "a"]).map((x) => x.id)).toEqual(["c", "a", "b"]);
  });

  it("drops unknown ids", () => {
    expect(orderDashboardWidgets(defaults, ["ghost", "b", "a"]).map((x) => x.id)).toEqual(["b", "a", "c"]);
  });
});

describe("normalizeDashboardToolOrderByMode", () => {
  it("filters bad shapes", () => {
    expect(normalizeDashboardToolOrderByMode(null)).toEqual({});
    expect(normalizeDashboardToolOrderByMode({ salaried: ["goals", "afford"] })).toEqual({
      salaried: ["goals", "afford"],
    });
  });
});
