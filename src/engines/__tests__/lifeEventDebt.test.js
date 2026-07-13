import { describe, it, expect } from "vitest";
import { summarizeLifeEventDebt } from "../lifeEventDebt.js";

describe("summarizeLifeEventDebt", () => {
  it("groups bills and liability entries under the same tag", () => {
    const commitments = [{ id: "c1", name: "Personal loan", remainingAmount: 200000, lifeEventTag: "wedding" }];
    const liabilities = [{ id: "l1", name: "Gold loan", value: 100000, lifeEventTag: "wedding" }];
    const result = summarizeLifeEventDebt(commitments, liabilities);
    expect(result.length).toBe(1);
    expect(result[0].tag).toBe("wedding");
    expect(result[0].totalOutstanding).toBe(300000);
    expect(result[0].items.length).toBe(2);
  });

  it("ignores untagged commitments/liabilities", () => {
    const commitments = [{ id: "c1", name: "Rent", remainingAmount: 15000 }];
    expect(summarizeLifeEventDebt(commitments, [])).toEqual([]);
  });
});
