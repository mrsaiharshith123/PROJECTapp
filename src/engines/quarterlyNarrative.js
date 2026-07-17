/**
 * Auto-generated 2-3 "beat" editorial summary each quarter, pulling from
 * net-worth snapshots + current wealth entries + commitments. Nobody else
 * in this category does narrative generation — a pie chart tells you the
 * shape, this tells you the story.
 *
 * Returns structured beats ({ key, params }), matching the insightKeys
 * pattern already used across netWorth engines, instead of baked English
 * prose — this app ships in 23 languages, so an engine must never return
 * final display text; the UI resolves each key via t(key, params).
 * @param {object} input
 * @param {{ month: string, netWorth: number, totalAssets: number, totalLiabilities: number }[]} input.snapshots
 * @param {import('../utils/netWorth/wealthStorage.js').WealthEntry[]} input.entries
 * @param {object[]} input.commitments
 */
export function buildQuarterlyNarrative({ snapshots, entries, commitments }) {
  const sorted = [...(snapshots || [])].sort((a, b) => a.month.localeCompare(b.month));
  if (sorted.length < 2) {
    return { hasData: false, beats: [] };
  }

  const start = sorted[0];
  const end = sorted[sorted.length - 1];
  const startNetWorth = Number(start.netWorth) || 0;
  const endNetWorth = Number(end.netWorth) || 0;
  const netWorthDelta = endNetWorth - startNetWorth;

  const visibleAssets = (entries || []).filter((e) => e.kind === "asset" && !e.hidden);
  const biggestAsset = [...visibleAssets].sort((a, b) => Number(b.value) - Number(a.value))[0];

  const stalledBills = (commitments || []).filter((c) => {
    if (!["EMI", "Loan"].includes(c.category)) return false;
    const payments = Array.isArray(c.payments) ? c.payments : [];
    return payments.length === 0 && Number(c.remainingAmount) > 0;
  });

  /** @type {{ key: string, params?: Record<string, string|number> }[]} */
  const beats = [];
  const grew = netWorthDelta >= 0;
  const amount = Math.abs(Math.round(netWorthDelta)).toLocaleString("en-IN");

  if (biggestAsset) {
    beats.push({
      key: grew ? "quarterlyNarrative.netWorthGrewWithDriver" : "quarterlyNarrative.netWorthShrankWithDriver",
      params: { amount, driverName: biggestAsset.name },
    });
  } else {
    beats.push({
      key: grew ? "quarterlyNarrative.netWorthGrew" : "quarterlyNarrative.netWorthShrank",
      params: { amount },
    });
  }

  if (end.totalLiabilities > 0 && end.totalAssets > 0) {
    beats.push({
      key: "quarterlyNarrative.liabilityShare",
      params: {
        pct: Math.round((end.totalLiabilities / end.totalAssets) * 100),
        amount: Math.round(end.totalLiabilities).toLocaleString("en-IN"),
      },
    });
  }

  if (stalledBills.length > 0) {
    beats.push({
      key: "quarterlyNarrative.stalledBill",
      params: { name: stalledBills[0].name, count: stalledBills.length },
    });
  }

  return {
    hasData: true,
    netWorthDelta: Math.round(netWorthDelta),
    direction: netWorthDelta >= 0 ? "up" : "down",
    beats,
    stalledBillIds: stalledBills.map((c) => c.id),
  };
}

/** Human-readable quarter label components for a given month (yyyy-MM) — UI formats via date-fns/i18n month names. */
export function quarterBoundsForMonth(monthKey) {
  const [yearStr, monthStr] = String(monthKey || "").split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month) return null;
  const quarterStartMonth = Math.floor((month - 1) / 3) * 3 + 1;
  return { year, startMonth: quarterStartMonth, endMonth: quarterStartMonth + 2 };
}

/** Which snapshots fall in the given quarter's month range. */
export function snapshotsInQuarter(snapshots, monthKey) {
  const bounds = quarterBoundsForMonth(monthKey);
  if (!bounds) return [];
  return (snapshots || []).filter((s) => {
    const [sy, sm] = String(s.month).split("-").map(Number);
    return sy === bounds.year && sm >= bounds.startMonth && sm <= bounds.endMonth;
  });
}
