/**
 * Human-readable share of income used by bills (handles tiny values).
 * @returns {string | null} e.g. "<1%", "0.1%", "12%"
 */
export function formatBurdenPercent(amount, monthlyIncome) {
  const income = Math.max(0, Number(monthlyIncome) || 0);
  const due = Math.max(0, Number(amount) || 0);
  if (income <= 0 || due <= 0) return null;

  const pct = (due / income) * 100;
  if (pct < 0.05) return "<0.1%";
  if (pct < 1) return "<1%";
  if (pct < 10) return `${pct.toFixed(1)}%`;
  return `${Math.min(100, Math.round(pct))}%`;
}
