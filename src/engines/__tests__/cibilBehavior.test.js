import { describe, it, expect } from "vitest";
import { simulateCibilBehavior } from "../cibilBehavior.js";

const getStatus = (c) => c._status || "pending";

describe("cibilBehavior", () => {
  it("returns higher score with clean history", () => {
    const clean = simulateCibilBehavior({
      commitments: [{ id: 1, amount: 2000, remainingAmount: 2000, _status: "pending", payments: [{ date: "2026-05-01", amount: 2000 }] }],
      lendings: [],
      getEffectiveStatus: getStatus,
      income: 50000,
    });
    const messy = simulateCibilBehavior({
      commitments: [{ id: 1, amount: 5000, remainingAmount: 5000, _status: "overdue" }],
      lendings: [],
      getEffectiveStatus: getStatus,
      income: 50000,
    });
    expect(clean.estimatedScore).toBeGreaterThan(messy.estimatedScore);
  });

  it("includes disclaimer narrative", () => {
    const r = simulateCibilBehavior({ commitments: [], lendings: [], getEffectiveStatus: getStatus, income: 0 });
    expect(r.narrativeLines.some((l) => l.includes("not your official"))).toBe(true);
  });
});
