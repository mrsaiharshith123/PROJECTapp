/** Primary + optional second income (household / dual earners). */
export function combinedMonthlyIncome(settings) {
  if (!settings || typeof settings !== "object") return 0;
  return (
    Math.max(0, Number(settings.monthlyIncome) || 0) +
    Math.max(0, Number(settings.secondaryMonthlyIncome) || 0)
  );
}
