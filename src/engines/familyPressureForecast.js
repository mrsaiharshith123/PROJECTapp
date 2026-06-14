import { buildFamilyExpenseCalendar } from "./familyCalendar.js";

/**
 * Pressure forecast insights for the family command center.
 * @param {object} input
 */
export function buildFamilyPressureForecast({
  commitments,
  todayStr,
  getEffectiveStatus,
  aheadPlan = null,
  pressureIntel = null,
  emergencyPct = null,
}) {
  const calendar = buildFamilyExpenseCalendar(commitments, todayStr, getEffectiveStatus, 8);
  /** @type {Array<{ id: string; tone: string; params?: Record<string, unknown> }>} */
  const insights = [...(calendar.insights || [])];

  if (pressureIntel?.nextMonth?.delta > 8) {
    insights.push({
      id: "family-forecast-pressure-rise",
      tone: "caution",
      params: { delta: Math.round(pressureIntel.nextMonth.delta) },
    });
  }

  const risky = (aheadPlan?.forecastMonths || []).filter((m) => m.freeCash < 0).slice(0, 2);
  if (risky.length) {
    insights.push({
      id: "family-forecast-low-liquidity",
      tone: "warning",
      params: { month: risky[0].label || risky[0].monthKey },
    });
  }

  if (emergencyPct != null && emergencyPct < 40) {
    insights.push({
      id: "family-forecast-emergency-weak",
      tone: "caution",
      params: { pct: emergencyPct },
    });
  }

  const schoolMonths = calendar.months.filter((m) =>
    m.items.some((i) => i.category === "School"),
  );
  if (schoolMonths[0]) {
    insights.push({
      id: "family-forecast-school-window",
      tone: "info",
      params: { month: schoolMonths[0].label, amount: Math.round(schoolMonths[0].amount) },
    });
  }

  return {
    calendar,
    heavyMonths: calendar.heavyMonths,
    riskyMonths: risky,
    insights: insights.slice(0, 6),
  };
}
