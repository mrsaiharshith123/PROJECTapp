import { format, parseISO } from "date-fns";
import { snapshotsToPressureTrend } from "./analyticsSeries.js";
import { forecastNextMonthBurden } from "./forecast.js";
import { pressureScoreLabel } from "./pressureScore.js";

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
  let trendMessage = null;
  if (recent.length >= 2) {
    const first = recent[0].pressure;
    const last = recent[recent.length - 1].pressure;
    const delta = last - first;
    if (delta >= 8) {
      trendMessage = `Pressure has risen about ${delta} points over recent months — obligations may be stacking up.`;
    } else if (delta <= -8) {
      trendMessage = `Pressure eased about ${Math.abs(delta)} points recently — you are moving toward calmer ground.`;
    }
  }

  const forecast = forecastNextMonthBurden(commitments, todayStr);
  let forecastMessage = null;
  if (forecast.total > 0 && forecast.nextMonthKey) {
    try {
      const monthName = format(parseISO(`${forecast.nextMonthKey}-01T12:00:00`), "MMMM");
      forecastMessage = `${monthName} may feel heavier — about ${forecast.itemNames.length} bill(s) due (~₹${Math.round(forecast.total).toLocaleString()}).`;
    } catch {
      forecastMessage = `Next month looks busier — about ₹${Math.round(forecast.total).toLocaleString()} scheduled.`;
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
    trendMessage,
    forecastMessage,
    sources,
    emotionalLabel: emotional.label,
    emotionalHint: emotional.hint,
  };
}
