import { format, parseISO } from "date-fns";
import { snapshotsToPressureTrend } from "./analyticsSeries.js";
import { forecastNextMonthBurden } from "./forecast.js";
import { pressureScoreLabel } from "./pressureScore.js";

const HINT_KEYS = {
  Safe: "pressure.hint.safe",
  Moderate: "pressure.hint.moderate",
  Constrained: "pressure.hint.constrained",
  Elevated: "pressure.hint.elevated",
  Critical: "pressure.hint.critical",
};

/**
 * Pressure sources, trend, and forward-looking narrative (reuses snapshot + forecast engines).
 */
export function buildPressureIntelligence({
  snapshots = [],
  commitments = [],
  todayStr,
  score,
  stressTop = [],
}) {
  const trend = snapshotsToPressureTrend(snapshots, 6);
  const recent = trend.filter((t) => t.pressure > 0);
  let trendMessageKey = null;
  let trendMessageParams = null;
  if (recent.length >= 2) {
    const first = recent[0].pressure;
    const last = recent[recent.length - 1].pressure;
    const delta = last - first;
    if (delta >= 8) {
      trendMessageKey = "pressure.trend.rising";
      trendMessageParams = { delta };
    } else if (delta <= -8) {
      trendMessageKey = "pressure.trend.easing";
      trendMessageParams = { delta: Math.abs(delta) };
    }
  }

  const forecast = forecastNextMonthBurden(commitments, todayStr);
  let forecastMessageKey = null;
  let forecastMessageParams = null;
  if (forecast.total > 0 && forecast.nextMonthKey) {
    try {
      const monthName = format(parseISO(`${forecast.nextMonthKey}-01T12:00:00`), "MMMM");
      forecastMessageKey = "pressure.forecast.monthNamed";
      forecastMessageParams = {
        month: monthName,
        count: forecast.itemNames.length,
        amount: `₹${Math.round(forecast.total).toLocaleString("en-IN")}`,
      };
    } catch {
      forecastMessageKey = "pressure.forecast.nextMonth";
      forecastMessageParams = { amount: `₹${Math.round(forecast.total).toLocaleString("en-IN")}` };
    }
  }

  const sources = (stressTop || []).slice(0, 4).map((r) => ({
    name: r.name,
    category: r.category,
    monthly: Math.round(r.weight),
  }));

  const emotional = pressureScoreLabel(score);

  return {
    trend,
    trendMessageKey,
    trendMessageParams,
    forecastMessageKey,
    forecastMessageParams,
    sources,
    emotionalLabel: emotional.label,
    emotionalHintKey: HINT_KEYS[emotional.label] || null,
  };
}
