import { describe, it, expect } from "vitest";
import { analyzeFdLadder, scanFdReinvestmentRisk } from "../fdRdTracker.js";

describe("analyzeFdLadder", () => {
  it("treats FDs maturing in the same narrow window as one cluster", () => {
    const fds = [
      { id: "fd1", categoryId: "fd", name: "FD1", value: 100000, maturityDate: "2025-03-15" },
      { id: "fd2", categoryId: "fd", name: "FD2", value: 200000, maturityDate: "2025-04-01" },
    ];
    const result = analyzeFdLadder(fds, "2025-01-01");
    expect(result.clusters.length).toBe(1);
    expect(result.clusters[0].fds.length).toBe(2);
    expect(result.isLaddered).toBe(false);
  });

  it("treats FDs maturing far apart as properly laddered", () => {
    const fds = [
      { id: "fd1", categoryId: "fd", name: "FD1", value: 100000, maturityDate: "2025-03-01" },
      { id: "fd2", categoryId: "fd", name: "FD2", value: 100000, maturityDate: "2026-09-01" },
    ];
    const result = analyzeFdLadder(fds, "2025-01-01");
    expect(result.clusters.length).toBe(0);
    expect(result.isLaddered).toBe(true);
    // With 2 equal-value FDs each in its own window, the largest single
    // cluster is inherently half the total (nothing wrong with that) —
    // staggerScore = 100 - largestClusterPct reflects that correctly.
    expect(result.staggerScore).toBe(50);
  });

  it("laddering N equal FDs across N distinct windows gives a staggerScore of 100 - (100/N)", () => {
    const fds = [1, 2, 3, 4].map((i) => ({
      id: `fd${i}`,
      categoryId: "fd",
      name: `FD${i}`,
      value: 100000,
      maturityDate: `${2025 + i}-01-01`,
    }));
    const result = analyzeFdLadder(fds, "2025-01-01");
    expect(result.isLaddered).toBe(true);
    expect(result.staggerScore).toBe(75); // 100 - 100/4
  });

  it("handles a single FD or no FDs without crashing", () => {
    expect(analyzeFdLadder([], "2025-01-01").isLaddered).toBe(true);
    const single = analyzeFdLadder([{ id: "fd1", categoryId: "fd", name: "FD1", value: 100000, maturityDate: "2025-03-01" }], "2025-01-01");
    expect(single.fds.length).toBe(1);
  });
});

describe("scanFdReinvestmentRisk", () => {
  it("flags an FD maturing soon at a rate well below market", () => {
    const fds = [{ id: "fd1", categoryId: "fd", name: "Old FD", value: 500000, interestRate: 6.5, maturityDate: "2025-01-15" }];
    const result = scanFdReinvestmentRisk(fds, 7.5, "2025-01-01", 30);
    expect(result.flagged.length).toBe(1);
    expect(result.flagged[0].rateGap).toBe(1);
    expect(result.flagged[0].estimatedAnnualImprovement).toBe(5000);
  });

  it("does not flag an FD maturing outside the warning window", () => {
    const fds = [{ id: "fd1", categoryId: "fd", name: "Far FD", value: 500000, interestRate: 6.5, maturityDate: "2026-01-01" }];
    const result = scanFdReinvestmentRisk(fds, 7.5, "2025-01-01", 30);
    expect(result.flagged.length).toBe(0);
  });

  it("does not flag when the FD rate already matches or beats market", () => {
    const fds = [{ id: "fd1", categoryId: "fd", name: "Good FD", value: 500000, interestRate: 8, maturityDate: "2025-01-15" }];
    const result = scanFdReinvestmentRisk(fds, 7.5, "2025-01-01", 30);
    expect(result.flagged.length).toBe(0);
  });
});
