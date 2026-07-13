/**
 * Cost-per-use for subscriptions/memberships — a lightweight habit loop:
 * periodically ask "how many times did you use this?" and divide the
 * monthly cost by that count. Uses an optional `usageCount`/`usageLoggedAt`
 * pair stored on the commitment itself; nothing is assumed if unset.
 * @param {object[]} commitments
 */
export function computeCostPerUse(commitments) {
  const eligible = (commitments || []).filter(
    (c) => c.category === "Subscription" && c.repeatType === "monthly" && Number(c.usageCount) > 0,
  );

  const rows = eligible.map((c) => {
    const amount = Math.max(0, Number(c.amount) || 0);
    const uses = Math.max(1, Number(c.usageCount) || 1);
    const costPerUse = amount / uses;
    return {
      id: c.id,
      name: c.name,
      amount,
      uses,
      costPerUse: Math.round(costPerUse * 100) / 100,
      usageLoggedAt: c.usageLoggedAt || null,
    };
  });

  const poorValue = rows.filter((r) => r.costPerUse >= 200).sort((a, b) => b.costPerUse - a.costPerUse);

  return { rows: rows.sort((a, b) => b.costPerUse - a.costPerUse), poorValue };
}

/** Which subscriptions are due for a usage check-in (never logged, or stale). */
export function subscriptionsDueForUsageCheckIn(commitments, todayStr, staleDays = 30) {
  const today = new Date(`${todayStr}T12:00:00`);
  return (commitments || []).filter((c) => {
    if (c.category !== "Subscription" || c.repeatType !== "monthly") return false;
    if (!c.usageLoggedAt) return true;
    try {
      const last = new Date(`${String(c.usageLoggedAt).slice(0, 10)}T12:00:00`);
      const days = (today.getTime() - last.getTime()) / 86400000;
      return days >= staleDays;
    } catch {
      return true;
    }
  });
}
