import { describe, expect, it } from "vitest";
import {
  localStateHasUserData,
  snapshotDataCounts,
  snapshotHasUserData,
} from "../snapshotData.js";

describe("snapshotData", () => {
  it("counts bills, lending, goals, and spends", () => {
    expect(
      snapshotDataCounts({
        commitments: [{ id: "a" }],
        lendings: [{ id: "b" }, { id: "c" }],
        goals: [],
        dailySpends: [{ id: "d" }],
      }),
    ).toEqual({ bills: 1, lending: 2, goals: 0, spends: 1 });
  });

  it("treats missing arrays as zero", () => {
    expect(snapshotDataCounts({})).toEqual({ bills: 0, lending: 0, goals: 0, spends: 0 });
  });

  it("detects whether a snapshot has user data", () => {
    expect(snapshotHasUserData({})).toBe(false);
    expect(snapshotHasUserData({ commitments: [] })).toBe(false);
    expect(snapshotHasUserData({ goals: [{ id: "g1" }] })).toBe(true);
  });

  it("detects local in-memory state with user data", () => {
    expect(localStateHasUserData({ commitments: [], lendings: [] })).toBe(false);
    expect(localStateHasUserData({ dailySpends: [{}] })).toBe(true);
    expect(localStateHasUserData({ lendings: [{}] })).toBe(true);
  });
});
