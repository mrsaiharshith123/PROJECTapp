import { formatInr } from "../../constants/symbols.js";

/**
 * Salary → fixed → variable → free cash (Analytics paycheck flow).
 */
export default function PaycheckBreakdown({ breakdown }) {
  if (!breakdown || breakdown.income <= 0) return null;

  const steps = [
    { label: "Monthly salary", value: breakdown.income, tone: "text-white" },
    { label: "Fixed commitments", value: -breakdown.fixedMonthly, tone: "text-amber-200" },
    { label: "Variable commitments", value: -breakdown.variableMonthly, tone: "text-violet-200" },
    {
      label: "Free cash remaining",
      value: breakdown.freeCash,
      tone: breakdown.freeCash >= 0 ? "text-emerald-300" : "text-red-300",
      bold: true,
    },
  ];

  return (
    <div className="space-y-3 border-t border-white/10 pt-4">
      <div>
        <h3 className="text-sm font-semibold text-indigo-100">Paycheck flow</h3>
        <p className="text-[11px] text-indigo-200/80 mt-0.5">
          How salary splits across fixed bills, flexible spend, and what is left.
        </p>
      </div>
      <div className="space-y-2">
        {steps.map((row, i) => (
          <div key={row.label}>
            {i > 0 && <p className="text-center text-indigo-300/60 text-xs py-0.5">↓</p>}
            <div className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2">
              <span className="text-xs text-indigo-100/90">{row.label}</span>
              <span className={`text-sm font-semibold ${row.tone} ${row.bold ? "text-base" : ""}`}>
                {row.value < 0 ? "−" : ""}
                {formatInr(Math.abs(row.value))}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-indigo-100/75 leading-relaxed">
        {breakdown.committedPercent != null ? `${breakdown.committedPercent}% of salary committed` : "Set salary in Profile"}
        {breakdown.safeSpending > 0 ? ` · Safer discretionary ≈ ${formatInr(breakdown.safeSpending)}` : ""}
        {breakdown.pressureImpact === "high"
          ? " · High pressure on take-home pay"
          : breakdown.pressureImpact === "moderate"
            ? " · Moderate pressure"
            : ""}
      </p>
    </div>
  );
}
