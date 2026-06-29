import { useMemo } from "react";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { usePrivacyAmount } from "../../../hooks/usePrivacyAmount.js";
import {
  analyzeInsuranceWorth,
  insuranceParamsFromBill,
} from "../../../engines/insuranceCalculator.js";
import { todayYmd } from "../../../utils/dates.js";

/**
 * Inflation-aware insurance worth panel for bill detail.
 * @param {{ bill: object }} props
 */
export default function InsuranceWorthPanel({ bill }) {
  const { t } = useTranslation();
  const { settings } = usePerovo();
  const { formatAmount } = usePrivacyAmount();
  const todayStr = todayYmd();

  const analysis = useMemo(() => {
    if (!bill || bill.category !== "Insurance") return null;
    const params = insuranceParamsFromBill(bill, todayStr);
    return analyzeInsuranceWorth({
      ...params,
      monthlyIncome: Number(settings.monthlyIncome) || 0,
      maturityBenefit: Number(bill.maturityBenefit) || Number(bill.sumAssured) || 0,
      sumAssured: Number(bill.sumAssured) || 0,
    });
  }, [bill, settings.monthlyIncome, todayStr]);

  if (!analysis) return null;

  const verdictKey = `wealthDetail.insurance.verdict.${analysis.verdict}`;
  const verdictLabel = t(verdictKey) !== verdictKey ? t(verdictKey) : analysis.verdictLabel;
  const verdictColor =
    analysis.verdict === "positive"
      ? "var(--ed-green)"
      : analysis.verdict === "negative"
        ? "var(--ed-red)"
        : "var(--ed-gold)";

  return (
    <div className="ed-ins-story" style={{ marginTop: 12 }}>
      <div className="ed-ins-kicker">{t("wealthDetail.insurance.title")}</div>
      <div className="ed-ins-cols">
        <div className="ed-ins-col">
          <span className="ed-ins-col-label">{t("wealthDetail.insurance.paid")}</span>
          <span className="ed-ins-col-val">{formatAmount(analysis.totalPremiumsPaid)}</span>
        </div>
        <div className="ed-ins-col">
          <span className="ed-ins-col-label">{t("wealthDetail.insurance.remaining")}</span>
          <span className="ed-ins-col-val">{formatAmount(analysis.remainingPremiumCost)}</span>
        </div>
        <div className="ed-ins-col">
          <span className="ed-ins-col-label">{t("wealthDetail.insurance.installmentsLeft")}</span>
          <span className="ed-ins-col-val">{analysis.installmentsRemaining}</span>
        </div>
      </div>
      {analysis.premiumShareOfIncome != null ? (
        <p className="ed-ins-body">
          {t("wealthDetail.insurance.incomeShare", { pct: analysis.premiumShareOfIncome })}
        </p>
      ) : null}
      {analysis.maturityInTodaysMoney > 0 ? (
        <p className="ed-ins-body">
          {t("wealthDetail.insurance.maturityToday", {
            amount: formatAmount(analysis.maturityInTodaysMoney),
          })}
        </p>
      ) : null}
      <p className="ed-ins-body" style={{ fontWeight: 600, color: verdictColor, marginTop: 8 }}>
        {verdictLabel}
      </p>
      <p className="ed-ins-body">{t(`wealthDetail.insurance.verdictDetail.${analysis.verdict}`)}</p>
    </div>
  );
}
