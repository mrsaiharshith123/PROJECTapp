import { describe, it, expect } from "vitest";
import { getEffectiveStatus } from "../commitmentStatus.js";

describe("getEffectiveStatus", () => {
  it("marks overdue when due date passed", () => {
    const c = { dueDate: "2020-01-01", status: "pending", remainingAmount: 100 };
    expect(getEffectiveStatus(c, "2026-05-15")).toBe("overdue");
  });

  it("marks paid when remaining is zero", () => {
    const c = { dueDate: "2026-06-01", status: "pending", remainingAmount: 0 };
    expect(getEffectiveStatus(c, "2026-05-15")).toBe("paid");
  });
});
