import { formatInr } from "../../constants/symbols.js";

/**
 * Salary → fixed → variable → free cash (Analytics paycheck flow).
 * Optional: payer split (family), card pressure, income shock rows — single rich surface vs Home duplicate.
 */
export default function PaycheckBreakdown({
  breakdown,
  anchorId = "paycheck-flow",
  incomeStepLabel = "Monthly salary",
  incomeEntryBasis,
  payerSplit,
  creditCard,
  sensitivityRows,
}) {
  if (!breakdown || breakdown.income <= 0) return null;

  const steps = [
    { label: incomeStepLabel, value: breakdown.income, tone: "text-white" },
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
    <div id={anchorId} className="scroll-mt-24 space-y-3 border-t border-white/10 pt-4">
      <div>
        <h3 className="text-sm font-semibold text-indigo-100">Paycheck flow</h3>
        <p className="text-[11px] text-indigo-200/80 mt-0.5">
          How income splits across fixed bills, flexible spend, and what is left.
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
        {breakdown.committedPercent != null ? `${breakdown.committedPercent}% of income committed` : "Set income in Profile"}
        {breakdown.safeSpending > 0 ? ` · Safer discretionary ≈ ${formatInr(breakdown.safeSpending)}` : ""}
        {breakdown.pressureImpact === "high"
          ? " · High pressure on take-home pay"
          : breakdown.pressureImpact === "moderate"
            ? " · Moderate pressure"
            : ""}
        {incomeEntryBasis === "gross" ? " · You entered gross income — net take-home is usually lower after tax." : ""}
      </p>

      {payerSplit?.rows?.length > 0 && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-1.5">
          <p className="text-xs font-semibold text-indigo-100">Household payer tags (open est.)</p>
          <p className="text-[10px] text-indigo-200/70">Approximate open amounts by who pays — does not change totals above.</p>
          <ul className="space-y-1">
            {payerSplit.rows.map((r) => (
              <li key={r.label} className="flex justify-between text-xs text-indigo-100/90 gap-2">
                <span>{r.label}</span>
                <span className="font-semibold shrink-0">{formatInr(Math.round(r.amount))}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {creditCard && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-1.5">
          <p className="text-xs font-semibold text-indigo-100">Credit cards (revolving)</p>
          <p className="text-[10px] text-indigo-200/80">
            {creditCard.count} card{creditCard.count === 1 ? "" : "s"} · Open ≈ {formatInr(creditCard.openBalance)} · Min due ≈{" "}
            {formatInr(creditCard.minimumDue)}
          </p>
          {creditCard.insights?.length > 0 && (
            <ul className="list-disc list-inside text-[11px] text-indigo-100/85 space-y-0.5">
              {creditCard.insights.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {sensitivityRows?.length > 0 && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-1.5">
          <p className="text-xs font-semibold text-indigo-100">Income shock (same dues)</p>
          <p className="text-[10px] text-indigo-200/70">Estimated free cash after burden if income drops; dues model unchanged.</p>
          <ul className="space-y-1">
            {sensitivityRows.map((r) => (
              <li key={r.cutPercent} className="flex justify-between text-xs text-indigo-100/90 gap-2">
                <span>−{r.cutPercent}% income → {formatInr(r.hypotheticalIncome)}/mo</span>
                <span className={`font-semibold shrink-0 ${r.freeMoney < 0 ? "text-red-300" : "text-emerald-200"}`}>
                  {formatInr(r.freeMoney)} free
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
