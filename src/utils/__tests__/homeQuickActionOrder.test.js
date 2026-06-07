import { describe, expect, it } from "vitest";
import {
  HOME_QUICK_ACTION_IDS,
  normalizeHomeQuickActionOrder,
  orderHomeQuickActions,
} from "../homeQuickActionOrder.js";

describe("homeQuickActionOrder", () => {
  it("returns default order when saved order is empty", () => {
    expect(orderHomeQuickActions(undefined)).toEqual(HOME_QUICK_ACTION_IDS);
    expect(orderHomeQuickActions([])).toEqual(HOME_QUICK_ACTION_IDS);
  });

  it("applies saved order and appends missing ids", () => {
    expect(orderHomeQuickActions(["analytics", "lending"])).toEqual([
      "analytics",
      "lending",
      "income",
      "calculators",
    ]);
  });

  it("drops unknown ids", () => {
    expect(normalizeHomeQuickActionOrder(["bogus", "income", "income"])).toEqual([
      "income",
      "lending",
      "calculators",
      "analytics",
    ]);
  });
});
