import { describe, expect, it } from "vitest";
import {
  lendingTrustByPerson,
  trustScoreForPerson,
  trustSummaryLine,
} from "../lendingTrust.js";

describe("lendingTrust", () => {
  it("returns neutral score near 50 for new borrower with no history", () => {
    const row = {
      personKey: "alice",
      displayName: "Alice",
      successfulRepayments: 0,
      delayedRepayments: 0,
      completedCycles: 0,
    };
    expect(trustScoreForPerson(row)).toBe(50);
  });

  it("increases score with successful repayments", () => {
    const row = {
      personKey: "bob",
      displayName: "Bob",
      successfulRepayments: 8,
      delayedRepayments: 0,
      completedCycles: 1,
    };
    expect(trustScoreForPerson(row)).toBeGreaterThan(50);
  });

  it("decreases score with delayed repayments", () => {
    const good = trustScoreForPerson({
      personKey: "c",
      displayName: "C",
      successfulRepayments: 6,
      delayedRepayments: 0,
      completedCycles: 0,
    });
    const late = trustScoreForPerson({
      personKey: "c",
      displayName: "C",
      successfulRepayments: 3,
      delayedRepayments: 3,
      completedCycles: 0,
    });
    expect(late).toBeLessThan(good);
  });

  it("trustSummaryLine always returns non-empty string", () => {
    const rows = lendingTrustByPerson([]);
    const fresh = {
      personKey: "x",
      displayName: "X",
      successfulRepayments: 0,
      delayedRepayments: 0,
      completedCycles: 0,
    };
    expect(trustSummaryLine(fresh).length).toBeGreaterThan(0);
    if (rows[0]) expect(trustSummaryLine(rows[0]).length).toBeGreaterThan(0);
  });

  it("lendingTrustByPerson groups by personKey", () => {
    const rows = lendingTrustByPerson([
      { personName: "Ravi", payments: [{ onTime: true }] },
      { personName: "ravi", payments: [{ onTime: false }] },
      { personName: "Priya", payments: [{ onTime: true }] },
    ]);
    expect(rows).toHaveLength(2);
    const ravi = rows.find((r) => r.personKey === "ravi");
    expect(ravi?.totalDeals).toBe(2);
    expect(ravi?.successfulRepayments).toBe(1);
    expect(ravi?.delayedRepayments).toBe(1);
  });
});
