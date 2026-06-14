/**
 * @param {object} input
 */
export function computeMomentumScore({ monthlySnapshots, commitments, getEffectiveStatus }) {
  const sorted = [...(monthlySnapshots || [])].sort((a, b) => a.month.localeCompare(b.month));
  const recent = sorted.slice(-3);

  /** @type {{ type: string, pts: number }[]} */
  const signals = [];

  if (recent.length >= 2) {
    const slope = recent.at(-1).pressureScore - recent[0].pressureScore;
    if (slope < -3) signals.push({ type: "pressure_down", pts: 2 });
    if (slope > 3) signals.push({ type: "pressure_up", pts: -2 });
  }

  const paidCommitments = commitments.filter((c) => getEffectiveStatus(c) === "paid");
  const overdueCommitments = commitments.filter((c) => getEffectiveStatus(c) === "overdue");
  if (overdueCommitments.length === 0 && paidCommitments.length > 0) {
    signals.push({ type: "all_clear", pts: 3 });
  }
  if (overdueCommitments.length > 0) signals.push({ type: "overdue", pts: -3 });

  const streakMonths = recent.filter((s) => !(Number(s.overdueSum) > 0)).length;
  if (streakMonths >= 3) signals.push({ type: "streak_3m", pts: 3 });
  else if (streakMonths >= 2) signals.push({ type: "streak_2m", pts: 1 });

  const raw = signals.reduce((s, sig) => s + sig.pts, 5);
  const score = Math.max(0, Math.min(10, raw));

  const labelKey =
    score >= 8
      ? "home.momentum.strong"
      : score >= 6
        ? "home.momentum.progress"
        : score >= 4
          ? "home.momentum.steady"
          : "home.momentum.attention";

  return { score, labelKey, signals, streakMonths };
}
