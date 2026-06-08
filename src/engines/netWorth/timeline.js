/**
 * Net worth life replay timeline — merges wealth snapshots with app events.
 */

/**
 * @param {object} input
 */
export function buildNetWorthTimeline(input) {
  /** @type {{ id: string, type: string, labelKey: string, month: string, value?: number, tone: string }[]} */
  const events = [];

  for (const s of input.snapshots || []) {
    if (s.netWorth >= 1000000 && s.netWorth < 1100000) {
      events.push({
        id: `nw-10l-${s.month}`,
        type: "milestone",
        labelKey: "netWorth.timeline.milestone10L",
        month: s.month,
        value: s.netWorth,
        tone: "positive",
      });
    }
    if (s.netWorth >= 500000 && s.netWorth < 550000) {
      events.push({
        id: `nw-5l-${s.month}`,
        type: "milestone",
        labelKey: "netWorth.timeline.milestone5L",
        month: s.month,
        value: s.netWorth,
        tone: "positive",
      });
    }
  }

  for (const m of input.milestones || []) {
    events.push({
      id: m.id,
      type: m.type,
      labelKey: m.labelKey,
      month: monthFromTimestamp(m.achievedAt),
      value: m.value,
      tone: "positive",
    });
  }

  if (input.debtClosedMonth) {
    events.push({
      id: "debt-closed",
      type: "debt",
      labelKey: "netWorth.timeline.debtClosed",
      month: input.debtClosedMonth,
      tone: "calm",
    });
  }

  if (input.savingsStreakMonths >= 5) {
    events.push({
      id: "savings-streak",
      type: "streak",
      labelKey: "netWorth.timeline.savingsStreak",
      month: currentMonth(),
      tone: "positive",
    });
  }

  return events
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 12);
}

function monthFromTimestamp(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
