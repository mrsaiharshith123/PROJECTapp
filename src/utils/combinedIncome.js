/** Primary monthly income + optional side incomes. */
export function totalMonthlyIncome(settings) {
  if (!settings || typeof settings !== "object") return 0;
  const primary = Math.max(0, Number(settings.monthlyIncome) || 0);
  const side = (settings.sideIncomes || []).reduce(
    (s, inc) => s + Math.max(0, Number(inc.monthlyAmount) || 0),
    0,
  );
  return primary + side;
}

export function combinedMonthlyIncome(settings) {
  return totalMonthlyIncome(settings);
}
