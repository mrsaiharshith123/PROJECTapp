import { useTranslation } from "../../../i18n/I18nProvider.js";
import { formatInr } from "../../../constants/symbols.js";

/**
 * Agreements hero — owed vs owe split with trust meta.
 */
export default function AgreementsHeroSummary({ totals, trustScore, dealCount = 0 }) {
  const { t } = useTranslation();
  const owed = Math.max(0, Number(totals?.lentRemaining ?? totals?.lentOutstanding) || 0);
  const owe = Math.max(0, Number(totals?.borrowedRemaining ?? totals?.borrowedOutstanding) || 0);

  return (
    <div className="pos-hero agreement">
      <div className="pos-hero-glow agreement" aria-hidden />
      <div className="ct-money-lending-split">
        <div>
          <p className="ct-stat-label">{t("money.lending.youAreOwed")}</p>
          <p className="pos-display-amount" style={{ fontSize: "clamp(20px, 5vw, 26px)", color: "var(--pos-agr)" }}>
            {formatInr(owed)}
          </p>
        </div>
        <div>
          <p className="ct-stat-label">{t("money.lending.youOwe")}</p>
          <p
            className="pos-display-amount liability"
            style={{ fontSize: "clamp(20px, 5vw, 26px)" }}
          >
            {formatInr(owe)}
          </p>
        </div>
      </div>
      {trustScore != null ? (
        <p className="ct-caption mt-2">
          {t("money.lending.trustMeta", { score: Math.round(trustScore), deals: dealCount })}
        </p>
      ) : null}
    </div>
  );
}
