import { describe, expect, it } from "vitest";
import { buildFamilyContributionMemory } from "../familyContribution.js";

describe("buildFamilyContributionMemory", () => {
  it("records primary payer contribution memory", () => {
    const mem = buildFamilyContributionMemory(
      [
        {
          category: "EMI",
          householdPayer: "primary",
          payments: [
            { amount: 15000, date: "2026-04-01" },
            { amount: 15000, date: "2026-05-01" },
            { amount: 15000, date: "2026-06-01" },
          ],
        },
      ],
      () => "paid",
      "2026-06-10",
    );
    expect(mem.memories.some((m) => m.id === "family-contribution-primary")).toBe(true);
  });
});
