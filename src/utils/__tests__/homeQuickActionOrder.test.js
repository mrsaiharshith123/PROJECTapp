import { describe, expect, it } from "vitest";
import {
  HOME_QUICK_ACTION_IDS,
  hiddenHomeQuickActions,
  normalizeHomeQuickActionOrder,
  orderHomeQuickActions,
} from "../homeQuickActionOrder.js";

describe("homeQuickActionOrder", () => {
  it("returns default order when saved order is empty", () => {
    expect(orderHomeQuickActions(undefined)).toEqual(HOME_QUICK_ACTION_IDS);
    expect(orderHomeQuickActions([])).toEqual(HOME_QUICK_ACTION_IDS);
  });

  it("respects explicit visible list without re-adding removed actions", () => {
    expect(orderHomeQuickActions(["analytics", "lending"])).toEqual(["analytics", "lending"]);
    expect(hiddenHomeQuickActions(["analytics", "lending"])).toEqual(["income", "calculators"]);
  });

  it("drops unknown ids", () => {
    expect(normalizeHomeQuickActionOrder(["bogus", "income", "income"])).toEqual(["income"]);
  });
});
