import { cn } from "../utils/cn.js";
import { SalarySpendBar } from "../patterns/SalarySpendBar.jsx";
import { MonthlySpendSparkline } from "../patterns/MonthlySpendSparkline.jsx";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { CtIcon } from "../icons/CtIcon.jsx";
import HouseholdFamilyBadge from "../patterns/HouseholdFamilyBadge.jsx";

export function HeroMonthCard({
  title,
  monthLabel,
  icon,
  scopeBadge,
  scheduled,
  paid,
  unpaid,
  spendPct,
  salaryLabel,
  spendTitleKey = "home.salarySpendTitle",
  overBudget = false,
  spendSeries = [],
  monthlyIncome = 0,
  sparklineHousehold = false,
  variableSpent,
  freeCashLabel,
  freeCashValue,
  freeCashWarn = false,
  statusLine = undefined,
  privacyMode = false,
  onTogglePrivacy,
  householdCount = undefined,
  onEditHousehold = undefined,
  onClick,
  className = "",
}) {
  const { t } = useTranslation();

  const metrics = [
    { label: t("home.metricScheduled"), value: scheduled },
    { label: t("home.metricPaid"), value: paid, valueClass: "ct-hero-metric-success" },
    { label: t("home.metricUnpaid"), value: unpaid, valueClass: "ct-hero-metric-warn" },
  ];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("ct-hero-month ct-hero-month-financial", className)}
      aria-label={t("home.openAnalytics")}
    >
      <div className="ct-hero-month-glow" aria-hidden />
      <div className="ct-row-between px-1 pt-1 pb-2 relative">
        <div className="text-left">
          <p className="ct-eyebrow">{title}</p>
          <p className="ct-caption mt-0.5">{monthLabel}</p>
          {scopeBadge ? (
            <span className="ct-hero-scope-badge">{scopeBadge}</span>
          ) : null}
        </div>
        <div className="ct-row gap-1.5 shrink-0">
          {onTogglePrivacy ? (
            <button
              type="button"
              className="ct-privacy-toggle"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePrivacy();
              }}
              aria-label={privacyMode ? t("netWorth.privacy.show") : t("netWorth.privacy.hide")}
            >
              <CtIcon name={privacyMode ? "eye-slash" : "eye"} size={18} />
            </button>
          ) : null}
          {householdCount != null ? (
            <HouseholdFamilyBadge
              count={householdCount}
              onEdit={onEditHousehold}
              iconSize={28}
              editLabel={t("household.edit.open")}
            />
          ) : icon ? (
            <span className="ct-hero-month-icon" aria-hidden>
              <CtIcon name={icon} size={28} />
            </span>
          ) : null}
        </div>
      </div>

      <div className="ct-hero-metrics-row px-1 mt-2 relative">
        {metrics.map((m) => (
          <div key={m.label} className="ct-hero-inset ct-hero-inset-financial">
            <p className="ct-hero-metric-label">{m.label}</p>
            <p className={cn("ct-hero-metric ct-numeral mt-1", m.valueClass)}>
              {privacyMode ? "••••" : m.value}
            </p>
          </div>
        ))}
      </div>

      {freeCashValue || variableSpent ? (
        <div className="ct-hero-cash-row mt-3 mx-1 relative">
          {freeCashValue ? (
            <div className="ct-hero-inset ct-hero-inset-financial ct-hero-cash-tile">
              <p className="ct-hero-metric-label">{freeCashLabel}</p>
              <p
                className={cn(
                  "ct-hero-metric ct-numeral mt-1",
                  freeCashWarn ? "ct-hero-metric-warn" : "ct-hero-metric-success",
                )}
              >
                {privacyMode ? "••••" : freeCashValue}
              </p>
            </div>
          ) : null}
          {variableSpent ? (
            <div className="ct-hero-inset ct-hero-inset-financial ct-hero-cash-tile">
              <p className="ct-hero-metric-label">{t("home.metricVariable")}</p>
              <p className="ct-hero-metric ct-numeral mt-1 ct-hero-metric-accent">
                {privacyMode ? "••••" : variableSpent}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {statusLine && !privacyMode ? (
        <div className="ct-hero-insight-block mt-2 mx-1 relative text-left">
          <p className="ct-eyebrow ct-home-insight-heading mb-1.5">{t("home.insight")}</p>
          {statusLine}
        </div>
      ) : null}

      <div className="ct-hero-spend-footer relative mt-3">
        <MonthlySpendSparkline
          data={spendSeries}
          salary={monthlyIncome}
          spendPct={spendPct}
          overBudget={overBudget}
          household={sparklineHousehold}
        />
      </div>

      <div className="px-1 mt-2 relative">
        <div className="ct-row-between ct-caption mb-1">
          <span>{t(spendTitleKey)}</span>
          <span className={overBudget ? "ct-hero-metric-danger font-semibold" : ""}>
            {privacyMode ? "••••" : salaryLabel}
          </span>
        </div>
        <SalarySpendBar pct={privacyMode ? 0 : spendPct} overBudget={privacyMode ? false : overBudget} />
      </div>

      <p className="ct-caption text-center pb-3 pt-1 relative opacity-80">{t("home.tapAnalytics")}</p>
    </button>
  );
}

export default HeroMonthCard;
