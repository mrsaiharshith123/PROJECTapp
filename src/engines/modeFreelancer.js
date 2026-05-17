/**
 * Irregular income signals from monthly snapshots.
 */
export function computeFreelancerVolatility(monthlySnapshots, monthlyIncome) {
  const sorted = [...(monthlySnapshots || [])].sort((a, b) => a.month.localeCompare(b.month));
  const incomes = sorted.map((s) => Math.max(0, Number(s.freeMoney) + Number(s.monthlyBurden) || Number(monthlyIncome)));
  if (incomes.length < 3) {
    return {
      consistencyScore: null,
      volatilityPercent: null,
      lowIncomeMonths: 0,
      clientConcentration: null,
      insights: [
        {
          id: "freelancer-need-data",
          tone: "info",
          text: "Keep logging income in Profile — variability analysis improves after a few months.",
        },
      ],
    };
  }

  const avg = incomes.reduce((a, b) => a + b, 0) / incomes.length;
  const variance =
    incomes.reduce((s, x) => s + (x - avg) ** 2, 0) / Math.max(1, incomes.length - 1);
  const std = Math.sqrt(variance);
  const volatilityPercent = avg > 0 ? Math.round((std / avg) * 100) : null;
  const lowIncomeMonths = incomes.filter((x) => x < avg * 0.7).length;
  const consistencyScore = volatilityPercent != null ? Math.max(0, Math.min(100, 100 - volatilityPercent)) : null;

  const insights = [];
  if (volatilityPercent != null && volatilityPercent > 35) {
    insights.push({
      id: "freelancer-volatile",
      tone: "warning",
      text: `Income looks unstable (volatility ~${volatilityPercent}%). Plan for ${lowIncomeMonths} weaker months.`,
    });
  }
  const gapMonths = avg > 0 ? Math.floor((avg * 3) / (avg * 0.6)) : null;
  if (gapMonths != null && gapMonths >= 2) {
    insights.push({
      id: "freelancer-gap",
      tone: "info",
      text: `You may survive about ${Math.min(6, gapMonths)} low-income months at current buffer levels.`,
    });
  }

  return {
    consistencyScore,
    volatilityPercent,
    lowIncomeMonths,
    averageIncome: Math.round(avg),
    insights,
  };
}

export function clientDependencyInsight(lendings) {
  const byPerson = {};
  for (const l of lendings) {
    if (l.type !== "lent") continue;
    const name = String(l.personName || "Unknown").trim();
    byPerson[name] = (byPerson[name] || 0) + Number(l.totalAmount) || 0;
  }
  const entries = Object.entries(byPerson).sort((a, b) => b[1] - a[1]);
  if (entries.length < 2) return null;
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total <= 0) return null;
  const topShare = Math.round((entries[0][1] / total) * 100);
  if (topShare < 50) return null;
  return {
    id: "client-concentration",
    tone: "warning",
    text: `${topShare}% of tracked client lending centers on ${entries[0][0]} — concentration risk.`,
    topShare,
    topClient: entries[0][0],
  };
}
