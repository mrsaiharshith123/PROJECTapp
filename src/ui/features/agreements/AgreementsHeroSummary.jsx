import { useTranslation } from "../../../i18n/I18nProvider.js";
import { usePrivacyAmount } from "../../../hooks/usePrivacyAmount.js";
import { ViewLink } from "../../patterns/ViewLink.jsx";

/**
 * Agreements hero — owed vs owe split with trust meta.
 * @param {{ totals: object, trustScore?: number, dealCount?: number, onViewDocuments?: () => void }} props
 */
export default function AgreementsHeroSummary({ totals, trustScore, dealCount = 0, onViewDocuments }) {
  const { t } = useTranslation();
  const { formatAmount } = usePrivacyAmount();
  const owed = Math.max(0, Number(totals?.lentRemaining ?? totals?.lentOutstanding) || 0);
  const owe = Math.max(0, Number(totals?.borrowedRemaining ?? totals?.borrowedOutstanding) || 0);

  return (
    <div
      className="pos-hero agreement"
      style={{
        margin: "0 16px 12px",
        borderRadius: 20,
        padding: "18px 18px 16px",
        border: "0.5px solid var(--pos-agr-border)",
        background: "linear-gradient(150deg,rgba(99,102,241,0.12),rgba(13,14,24,0.95) 50%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -20,
          right: -10,
          width: 100,
          height: 100,
          borderRadius: "50%",
          pointerEvents: "none",
          background: "radial-gradient(circle,rgba(99,102,241,0.2),transparent 70%)",
        }}
      />
      <div className="ct-money-lending-split relative">
        <div>
          <p className="ct-stat-label">{t("money.lending.youAreOwed")}</p>
          <p style={{ color: "var(--pos-agr)", fontSize: 22, fontWeight: 700 }}>{formatAmount(owed)}</p>
        </div>
        <div>
          <p className="ct-stat-label">{t("money.lending.youOwe")}</p>
          <p style={{ color: "#fbbf24", fontSize: 22, fontWeight: 700 }}>{formatAmount(owe)}</p>
        </div>
      </div>
      {trustScore != null ? (
        <p className="ct-caption mt-2">
          {t("money.lending.trustMeta", { score: Math.round(trustScore), deals: dealCount })}
        </p>
      ) : null}
      {onViewDocuments ? (
        <div className="mt-2">
          <ViewLink label={t("agreements.viewDocuments")} onClick={onViewDocuments} />
        </div>
      ) : null}
    </div>
  );
}
