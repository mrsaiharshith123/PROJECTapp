import { useTranslation } from "../../../i18n/I18nProvider.js";
import { usePrivacyAmount } from "../../../hooks/usePrivacyAmount.js";

/**
 * Agreements hero — owed vs owe split.
 * @param {{ totals: object, dealCount?: number, onViewDocuments?: () => void }} props
 */
export default function AgreementsHeroSummary({ totals, dealCount = 0, onViewDocuments }) {
  const { t } = useTranslation();
  const { formatAmount } = usePrivacyAmount();
  const owed = Math.max(0, Number(totals?.lentRemaining ?? totals?.lentOutstanding) || 0);
  const owe = Math.max(0, Number(totals?.borrowedRemaining ?? totals?.borrowedOutstanding) || 0);

  return (
    <div className="ed-ins-story" style={{ borderBottom: "1px solid var(--ed-rule)" }}>
      <div className="ed-ins-kicker">{t("home.section.yourPosition")}</div>
      <div className="ed-ins-cols">
        <div className="ed-ins-col">
          <span className="ed-ins-col-label">{t("money.lending.youAreOwed")}</span>
          <span className="ed-ins-col-val" style={{ color: "var(--ed-indigo)" }}>
            {formatAmount(owed)}
          </span>
          <span className="ed-ins-col-meta">{t("agreements.ed.outstandingMeta")}</span>
        </div>
        <div className="ed-ins-col">
          <span className="ed-ins-col-label">{t("money.lending.youOwe")}</span>
          <span className="ed-ins-col-val" style={{ color: "var(--ed-gold)" }}>
            {formatAmount(owe)}
          </span>
          <span className="ed-ins-col-meta">{t("agreements.ed.toRepayMeta")}</span>
        </div>
        {dealCount > 0 ? (
          <div className="ed-ins-col">
            <span className="ed-ins-col-label">{t("agreements.ed.dealCountLabel")}</span>
            <span className="ed-ins-col-val">{dealCount}</span>
            <span className="ed-ins-col-meta">
              {dealCount === 1
                ? t("agreements.ed.dealCountOne")
                : t("agreements.ed.dealCount", { count: dealCount })}
            </span>
          </div>
        ) : null}
      </div>
      {onViewDocuments ? (
        <button type="button" className="ed-ins-link" style={{ padding: "8px 0 0" }} onClick={onViewDocuments}>
          {t("agreements.viewDocumentsLink")}
        </button>
      ) : null}
    </div>
  );
}
