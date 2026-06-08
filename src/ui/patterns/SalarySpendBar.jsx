import { salarySpendBarColor } from "../../utils/salarySpendBar.js";

/**
 * Spend vs salary — fill grows 0 → salary; color shifts green → red.
 * @param {{ pct: number, overBudget?: boolean }} props
 */
export function SalarySpendBar({ pct, overBudget = false }) {
  const fillPct = Math.min(100, Math.max(0, Number(pct) || 0));
  const color = overBudget || pct >= 100 ? "#ef4444" : salarySpendBarColor(fillPct);

  return (
    <div className="ct-salary-spend-track" role="presentation">
      <div
        className="ct-salary-spend-fill"
        style={{
          width: `${fillPct}%`,
          background: color,
          boxShadow: `0 0 14px ${color}66`,
        }}
      />
      <span className="ct-salary-spend-cap" aria-hidden />
    </div>
  );
}
