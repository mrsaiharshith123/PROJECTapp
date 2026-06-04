import { describe, expect, it } from "vitest";
import { explainInsight } from "../guidance/explainInsight.js";
import { isAppSnapshot } from "../storage/appSnapshot.js";
import { ONBOARDING_EXPERIENCES } from "../guidance/registry/onboardingCopy.js";
import { getAppTourSteps } from "../guidance/registry/appTour.js";

describe("guidance", () => {
  it("explains insights with reasons", () => {
    const out = explainInsight({ id: "overdue-bills", text: "You have overdue bills" }, { overdueCount: 2 });
    expect(out.reasons.length).toBeGreaterThan(0);
    expect(out.headline).toContain("overdue");
  });

  it("validates app snapshot shape", () => {
    expect(isAppSnapshot({ commitments: [] })).toBe(true);
    expect(isAppSnapshot(null)).toBe(false);
    expect(isAppSnapshot([])).toBe(false);
  });

  it("has three onboarding experiences", () => {
    expect(ONBOARDING_EXPERIENCES.map((e) => e.id)).toEqual(["salaried", "household", "business"]);
  });

  it("builds mode-specific app tour", () => {
    const steps = getAppTourSteps({ userMode: "business", householdScope: "single" });
    expect(steps.length).toBeGreaterThan(4);
    expect(steps.some((s) => s.id === "mode-business")).toBe(true);
  });
});
