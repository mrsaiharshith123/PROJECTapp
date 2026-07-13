import { describe, it, expect } from "vitest";
import { buildLendingNetworkGraph } from "../lendingNetworkGraph.js";

describe("buildLendingNetworkGraph", () => {
  it("builds correct nodes and edges for a mix of lent and borrowed records", () => {
    const lendings = [
      { id: "l1", type: "lent", personName: "Ravi", remainingAmount: 20000 },
      { id: "l2", type: "borrowed", personName: "Priya", remainingAmount: 5000 },
    ];
    const graph = buildLendingNetworkGraph(lendings);
    expect(graph.owedToUser).toBe(20000);
    expect(graph.owedByUser).toBe(5000);
    expect(graph.selfNetPosition).toBe(15000);
    expect(graph.edges.length).toBe(2);
    expect(graph.topCounterparty.id).toBe("ravi");
  });

  it("excludes fully-settled records (remainingAmount 0)", () => {
    const lendings = [{ id: "l1", type: "lent", personName: "Ravi", remainingAmount: 0 }];
    const graph = buildLendingNetworkGraph(lendings);
    expect(graph.edges.length).toBe(0);
    expect(graph.owedToUser).toBe(0);
  });

  it("merges multiple records with the same counterparty into one node", () => {
    const lendings = [
      { id: "l1", type: "lent", personName: "Ravi", remainingAmount: 10000 },
      { id: "l2", type: "lent", personName: "ravi", remainingAmount: 5000 },
    ];
    const graph = buildLendingNetworkGraph(lendings);
    expect(graph.counterpartyCount).toBe(1);
    expect(graph.topCounterparty.netPosition).toBe(-15000);
  });
});
