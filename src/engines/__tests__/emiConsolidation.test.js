import { describe, expect, it } from "vitest";
import { buildEmiConsolidationPlan } from "../emiConsolidation.js";

const status = () => "pending";

describe("buildEmiConsolidationPlan", () => {
  it("returns null when fewer than 2 active EMIs", () => {
    expect(
      buildEmiConsolidationPlan(
        [{ category: "EMI", endDate: "2027-01-01", amount: 5000, name: "Car" }],
        status,
      ),
    ).toBeNull();
  });

  it("plan is sorted by endDate ascending", () => {
    const plan = buildEmiConsolidationPlan(
      [
        { category: "EMI", endDate: "2028-06-01", amount: 8000, name: "Home" },
        { category: "Loan", endDate: "2027-03-01", amount: 3000, name: "Phone" },
      ],
      status,
    );
    expect(plan?.plan[0].name).toBe("Phone");
    expect(plan?.plan[1].name).toBe("Home");
  });

  it("totalRelief sums all EMI amounts", () => {
    const plan = buildEmiConsolidationPlan(
      [
        { category: "EMI", endDate: "2027-01-01", amount: 5000, name: "A" },
        { category: "EMI", endDate: "2028-01-01", amount: 7000, name: "B" },
      ],
      status,
    );
    expect(plan?.totalRelief).toBe(12000);
  });
});
