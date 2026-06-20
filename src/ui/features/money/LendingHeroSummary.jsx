import { useTranslation } from "../../../i18n/I18nProvider.js";
import { formatInr } from "../../../constants/symbols.js";

/**
 * Lending overview hero — owed vs owe split.
 * @param {{ totals: { lentRemaining?: number, borrowedRemaining?: number, lentOutstanding?: number, borrowedOutstanding?: number }, trustScore?: number, dealCount?: number }} props
 */
export default function LendingHeroSummary({ totals, trustScore, dealCount = 0 }) {
  const { t } = useTranslation();
  const owed = Math.max(0, Number(totals?.lentRemaining ?? totals?.lentOutstanding) || 0);
  const owe = Math.max(0, Number(totals?.borrowedRemaining ?? totals?.borrowedOutstanding) || 0);

  return (
    <div className="ct-hero-card lending ct-money-lending-hero">
      <div className="ct-hero-glow teal" aria-hidden />
      <p className="ct-hero-label">{t("money.lending.overviewLabel")}</p>
      <div className="ct-money-lending-split">
        <div>
          <p className="ct-stat-label">{t("money.lending.youAreOwed")}</p>
          <p className="ct-money-lending-teal">{formatInr(owed)}</p>
        </div>
        <div>
          <p className="ct-stat-label">{t("money.lending.youOwe")}</p>
          <p className="ct-money-lending-amber">{formatInr(owe)}</p>
        </div>
      </div>
      {trustScore != null ? (
        <p className="ct-money-hero-sub">
          {t("money.lending.trustMeta", { score: Math.round(trustScore), deals: dealCount })}
        </p>
      ) : null}
    </div>
  );
}
