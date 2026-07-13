/**
 * Who-owes-whom as a graph — pure new lens over lending records already
 * stored, no new data. Nodes are the user + every counterparty; edges carry
 * direction (lent vs borrowed) and outstanding amount.
 * @param {object[]} lendings
 * @param {string} [selfLabel]
 */
export function buildLendingNetworkGraph(lendings, selfLabel = "You") {
  /** @type {Map<string, { id: string, label: string, netPosition: number }>} */
  const nodes = new Map();
  nodes.set("__self__", { id: "__self__", label: selfLabel, netPosition: 0 });

  /** @type {{ source: string, target: string, amount: number, type: 'lent'|'borrowed', status: string, id: string }[]} */
  const edges = [];

  for (const l of lendings || []) {
    const remaining = Math.max(0, Number(l.remainingAmount) || 0);
    if (remaining <= 0) continue;
    const personKey = String(l.personName || "unknown").trim().toLowerCase();
    if (!nodes.has(personKey)) {
      nodes.set(personKey, { id: personKey, label: l.personName || "Unknown", netPosition: 0 });
    }
    const person = nodes.get(personKey);
    const self = nodes.get("__self__");

    if (l.type === "lent") {
      // User lent money -> counterparty owes user -> edge counterparty -> self
      edges.push({ source: personKey, target: "__self__", amount: remaining, type: "lent", status: l.status, id: l.id });
      person.netPosition -= remaining;
      self.netPosition += remaining;
    } else {
      edges.push({ source: "__self__", target: personKey, amount: remaining, type: "borrowed", status: l.status, id: l.id });
      person.netPosition += remaining;
      self.netPosition -= remaining;
    }
  }

  const self = nodes.get("__self__");
  const owedToUser = edges.filter((e) => e.type === "lent").reduce((s, e) => s + e.amount, 0);
  const owedByUser = edges.filter((e) => e.type === "borrowed").reduce((s, e) => s + e.amount, 0);

  // Largest single counterparty exposure — concentration risk in informal lending too.
  const byCounterparty = [...nodes.values()]
    .filter((n) => n.id !== "__self__")
    .sort((a, b) => Math.abs(b.netPosition) - Math.abs(a.netPosition));

  return {
    nodes: [...nodes.values()],
    edges,
    selfNetPosition: self.netPosition,
    owedToUser,
    owedByUser,
    topCounterparty: byCounterparty[0] || null,
    counterpartyCount: byCounterparty.length,
  };
}
