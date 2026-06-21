import { formatInr } from "../../../constants/symbols.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { Caption, Body } from "../../primitives/Text.jsx";

const STEP_TILE = {
  income: "teal",
  fixed: "amber",
  variable: "indigo",
  freePositive: "teal",
  freeNegative: "danger",
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
  sensitivityRows = [],
}) {
  const { t } = useTranslation();

  if (!breakdown || breakdown.income <= 0) return null;

  const steps = [
    { label: incomeStepLabel, value: breakdown.income, tone: "income" },
    {
      label: t("analytics.recurringBills"),
      value: -(breakdown.recurringMonthly ?? breakdown.fixedMonthly),
      tone: "fixed",
    },
    {
      label: t("analytics.variableLoggedSpend"),
      value: -(breakdown.loggedSpendThisMonth ?? breakdown.variableMonthly),
      tone: "variable",
      detail:
        breakdown.loggedSpendThisMonth > 0
          ? t("analytics.variableLoggedHint")
          : t("analytics.variableLoggedEmpty"),
    },
    {
      label: t("analytics.freeCashRemaining"),
      value: breakdown.freeCash,
      tone: breakdown.freeCash >= 0 ? "freePositive" : "freeNegative",
      bold: true,
    },
  ];

  const footerParts = [];
  if (breakdown.committedPercent != null) {
    footerParts.push(t("analytics.incomeCommitted", { percent: breakdown.committedPercent }));
  } else {
    footerParts.push(t("analytics.setIncomeProfile"));
  }
  if (breakdown.safeSpending > 0) {
    footerParts.push(t("analytics.saferDiscretionary", { amount: formatInr(breakdown.safeSpending) }));
  }
  if (breakdown.pressureImpact === "high") {
    footerParts.push(t("analytics.highPressureTakeHome"));
  } else if (breakdown.pressureImpact === "moderate") {
    footerParts.push(t("analytics.moderatePressure"));
  }
  if (incomeEntryBasis === "gross") {
    footerParts.push(t("analytics.grossIncomeNote"));
  }

  return (
    <div id={anchorId} className="ct-hero-card wealth ct-stack relative" style={{ scrollMarginTop: "6rem" }}>
      <div className="ct-hero-glow teal" aria-hidden />
      <div className="relative">
        <Body className="font-semibold">{t("analytics.paycheckFlow")}</Body>
        <Caption className="block mt-0.5">{t("analytics.paycheckFlowDesc")}</Caption>
      </div>
      <div className="relative ct-stack-sm">
        {steps.map((row, i) => (
          <div key={row.label}>
            {i > 0 && <p className="ct-paycheck-arrow">↓</p>}
            <div className={`ct-stat-tile ${STEP_TILE[row.tone]} ct-row-between gap-2 items-center`}>
              <span className="ct-stat-label min-w-0">
                {row.label}
                {row.detail ? <span className="block text-[11px] opacity-80 mt-0.5">{row.detail}</span> : null}
              </span>
              <span className={`ct-stat-value ct-numeral shrink-0 ${row.bold ? "!text-lg" : ""}`}>
                {row.value < 0 ? "−" : ""}
                {formatInr(Math.abs(row.value))}
              </span>
            </div>
          </div>
        ))}
      </div>
      <Caption className="leading-relaxed relative">{footerParts.join(" · ")}</Caption>

      {payerSplit?.rows?.length > 0 && (
        <div className="ct-stat-tile indigo ct-stack-sm relative">
          <Body className="text-xs font-semibold">{t("analytics.householdPayerTags")}</Body>
          <Caption>{t("analytics.payerTagsHint")}</Caption>
          <ul className="ct-stack-sm">
            {payerSplit.rows.map((r) => (
              <li key={r.label} className="ct-row-between ct-caption">
                <span>{r.label}</span>
                <span className="ct-stat-value ct-numeral shrink-0">{formatInr(Math.round(r.amount))}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {creditCard && (
        <div className="ct-stat-tile amber ct-stack-sm relative">
          <Body className="text-xs font-semibold">{t("analytics.creditCardsRevolving")}</Body>
          <Caption className="ct-numeral">
            {t("analytics.cardSummary", {
              count: creditCard.count,
              open: formatInr(creditCard.openBalance),
              minDue: formatInr(creditCard.minimumDue),
            })}
          </Caption>
          {creditCard.insights?.length > 0 && (
            <ul className="ct-stack-sm ct-caption">
              {creditCard.insights.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {sensitivityRows?.length > 0 && (
        <div className="ct-stat-tile indigo ct-stack-sm relative">
          <Body className="text-xs font-semibold">{t("analytics.incomeShock")}</Body>
          <Caption>{t("analytics.incomeShockDesc")}</Caption>
          <ul className="ct-stack-sm">
            {sensitivityRows.map((r) => (
              <li key={r.cutPercent} className="ct-row-between ct-caption gap-2">
                <span>
                  {t("analytics.incomeCutLine", {
                    cut: r.cutPercent,
                    income: formatInr(r.hypotheticalIncome),
                  })}
                </span>
                <span className={`ct-stat-value ct-numeral shrink-0 ${r.freeMoney < 0 ? "ct-text-danger" : "ct-text-success"}`}>
                  {t("analytics.freeAmount", { amount: formatInr(r.freeMoney) })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
