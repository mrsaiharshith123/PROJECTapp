import { describe, expect, it } from "vitest";
import {
  defaultDueDateFromStart,
  defaultEndDateFromStart,
  applyBillStartDateChange,
} from "../billDates.js";

describe("billDates", () => {
  it("end date uses start month/day and current year", () => {
    expect(defaultEndDateFromStart("2020-03-15", "2026-05-10")).toBe("2026-03-15");
  });

  it("due date is next cycle on or after today, not start copy", () => {
    const due = defaultDueDateFromStart("2020-03-15", "monthly", "2026-05-10");
    expect(due).not.toBe("2020-03-15");
    expect(due >= "2026-05-10").toBe(true);
  });

  it("applyBillStartDateChange sets due and end", () => {
    const next = applyBillStartDateChange(
      { startDate: "", dueDate: "", endDate: "", repeatType: "monthly" },
      "2022-06-01",
      "2026-05-10"
    );
    expect(next.startDate).toBe("2022-06-01");
    expect(next.endDate).toBe("2026-06-01");
    expect(next.dueDate).toMatch(/^2026-/);
  });
});
