import { describe, it, expect } from "vitest";
import { rankStressContributors } from "../stressContributors.js";

describe("rankStressContributors", () => {
  it("does not inflate subscription pressure with interest boost", () => {
    const rank = rankStressContributors(
      [
        {
          id: "n",
          name: "Netflix",
          category: "Subscription",
          amount: 199,
          remainingAmount: 199,
          repeatType: "monthly",
        },
      ],
      () => "pending"
    );
    expect(rank.top[0].weight).toBe(199);
  });
});
