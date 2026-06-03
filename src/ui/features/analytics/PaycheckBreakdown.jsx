import { formatInr } from "../../../constants/symbols.js";
import { Caption, Body } from "../../primitives/Text.jsx";

const TONE_CLASS = {
  income: "ct-text",
  fixed: "ct-text-warning",
  variable: "ct-text-accent",
  freePositive: "ct-text-success",
  freeNegative: "ct-text-danger",
};

/**
 * Salary → fixed → variable → free cash (Analytics paycheck flow).
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
    { label: incomeStepLabel, value: breakdown.income, tone: "income" },
    { label: "Fixed commitments", value: -breakdown.fixedMonthly, tone: "fixed" },
    { label: "Variable commitments", value: -breakdown.variableMonthly, tone: "variable" },
    {
      label: "Free cash remaining",
      value: breakdown.freeCash,
      tone: breakdown.freeCash >= 0 ? "freePositive" : "freeNegative",
      bold: true,
    },
  ];

  return (
    <div id={anchorId} className="ct-paycheck-section">
      <div>
        <Body className="font-semibold">Paycheck flow</Body>
        <Caption className="block mt-0.5">How income splits across fixed bills, flexible spend, and what is left.</Caption>
      </div>
      <div className="ct-stack-sm">
        {steps.map((row, i) => (
          <div key={row.label}>
            {i > 0 && <p className="ct-paycheck-arrow">↓</p>}
            <div className="ct-paycheck-row">
              <span className="ct-caption">{row.label}</span>
              <span className={`ct-metric-value ${TONE_CLASS[row.tone]} ${row.bold ? "text-base" : ""}`}>
                {row.value < 0 ? "−" : ""}
                {formatInr(Math.abs(row.value))}
              </span>
            </div>
          </div>
        ))}
      </div>
      <Caption className="leading-relaxed">
        {breakdown.committedPercent != null ? `${breakdown.committedPercent}% of income committed` : "Set income in Profile"}
        {breakdown.safeSpending > 0 ? ` · Safer discretionary ≈ ${formatInr(breakdown.safeSpending)}` : ""}
        {breakdown.pressureImpact === "high"
          ? " · High pressure on take-home pay"
          : breakdown.pressureImpact === "moderate"
            ? " · Moderate pressure"
            : ""}
        {incomeEntryBasis === "gross" ? " · You entered gross income — net take-home is usually lower after tax." : ""}
      </Caption>

      {payerSplit?.rows?.length > 0 && (
        <div className="ct-paycheck-subpanel">
          <Body className="text-xs font-semibold">Household payer tags (open est.)</Body>
          <Caption>Approximate open amounts by who pays — does not change totals above.</Caption>
          <ul className="ct-stack-sm">
            {payerSplit.rows.map((r) => (
              <li key={r.label} className="ct-row-between ct-caption">
                <span>{r.label}</span>
                <span className="font-semibold shrink-0">{formatInr(Math.round(r.amount))}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {creditCard && (
        <div className="ct-paycheck-subpanel">
          <Body className="text-xs font-semibold">Credit cards (revolving)</Body>
          <Caption>
            {creditCard.count} card{creditCard.count === 1 ? "" : "s"} · Open ≈ {formatInr(creditCard.openBalance)} · Min due ≈{" "}
            {formatInr(creditCard.minimumDue)}
          </Caption>
          {creditCard.insights?.length > 0 && (
            <ul className="ct-stack-sm ct-caption">
              {creditCard.insights.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {sensitivityRows?.length > 0 && (
        <div className="ct-paycheck-subpanel">
          <Body className="text-xs font-semibold">Income shock (same dues)</Body>
          <Caption>Estimated free cash after burden if income drops; dues model unchanged.</Caption>
          <ul className="ct-stack-sm">
            {sensitivityRows.map((r) => (
              <li key={r.cutPercent} className="ct-row-between ct-caption">
                <span>
                  −{r.cutPercent}% income → {formatInr(r.hypotheticalIncome)}/mo
                </span>
                <span className={`font-semibold shrink-0 ${r.freeMoney < 0 ? "ct-text-danger" : "ct-text-success"}`}>
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
