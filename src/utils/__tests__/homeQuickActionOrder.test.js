import { describe, expect, it } from "vitest";
import {
  HOME_QUICK_ACTION_IDS,
  hiddenHomeQuickActions,
  normalizeHomeQuickActionOrder,
  orderHomeQuickActions,
} from "../homeQuickActionOrder.js";

describe("homeQuickActionOrder", () => {
  it("returns default visible set when saved order is empty", () => {
    expect(orderHomeQuickActions(undefined)).toEqual(["lending", "income", "calculators", "analytics"]);
    expect(orderHomeQuickActions([])).toEqual(["lending", "income", "calculators", "analytics"]);
  });

  it("respects explicit visible list without re-adding removed actions", () => {
    expect(orderHomeQuickActions(["analytics", "lending", "bills"])).toEqual(["analytics", "lending", "bills"]);
    expect(hiddenHomeQuickActions(["analytics", "lending"])).not.toContain("analytics");
    expect(hiddenHomeQuickActions(["analytics", "lending"])).toContain("bills");
  });

  it("drops unknown ids", () => {
    expect(normalizeHomeQuickActionOrder(["bogus", "income", "income"])).toEqual(["income"]);
  });

  it("includes expanded catalog ids", () => {
    expect(HOME_QUICK_ACTION_IDS).toContain("add_bill");
    expect(HOME_QUICK_ACTION_IDS).toContain("bills");
    expect(HOME_QUICK_ACTION_IDS).toContain("log_spend");
  });
});
