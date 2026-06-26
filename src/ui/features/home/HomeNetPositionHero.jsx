import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { usePrivacyAmount } from "../../../hooks/usePrivacyAmount.js";
import { pressureScoreLabel } from "../../../engines/pressureScore.js";

/** Net position hero — primary home dashboard number. */
export default function HomeNetPositionHero() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { core } = useNetWorth();
  const { formatAmount, formatScore } = usePrivacyAmount();
  const { stability, pressureAnalysis } = useCommitIntel();
  const score = stability?.score ?? pressureAnalysis?.score ?? 0;

  const netPosition = core.totalAssets - core.totalLiabilities;
  const positive = netPosition >= 0;
  const meta = pressureScoreLabel(score);

  const scoreColor =
    meta.tone === "danger"
      ? "var(--pos-danger)"
      : meta.tone === "warning"
        ? "var(--pos-warning)"
        : "var(--pos-positive)";

  const trendChip = useMemo(() => {
    if (core.totalAssets > 0 && core.totalLiabilities > 0) {
      return t("home.position.trendStable");
    }
    return t("home.position.trendBuilding");
  }, [core.totalAssets, core.totalLiabilities, t]);

  return (
    <div
      className={`pos-hero ${positive ? "asset" : "liability"} w-full`}
      style={{
        background: positive
          ? "linear-gradient(150deg, rgba(16,185,129,0.12), rgba(13,14,24,0.95) 50%, rgba(244,63,94,0.06))"
          : "linear-gradient(150deg, rgba(244,63,94,0.12), rgba(13,14,24,0.95) 50%)",
        borderColor: positive ? "var(--pos-asset-border)" : "var(--pos-liab-border)",
        cursor: "default",
      }}
    >
      <div className="pos-hero-glow asset" aria-hidden />

      {/* Net position number — taps to Ledger */}
      <button
        type="button"
        className="ct-pressable text-left w-full"
        style={{ background: "none", border: "none", padding: 0 }}
        onClick={() => navigate("/ledger")}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p className="ct-caption uppercase tracking-wide">{t("home.position.netLabel")}</p>
          <span style={{ fontSize: 10, color: "var(--pos-text-muted)", opacity: 0.7 }}>{t("home.position.tapLedger")}</span>
        </div>
        <p
          className="pos-display-amount"
          style={{ color: positive ? "var(--pos-gold)" : "var(--pos-liab)" }}
        >
          {positive ? "" : "−"}
          {formatAmount(Math.abs(netPosition))}
        </p>
        <p className="ct-caption mt-1">
          {positive ? t("home.position.netSubtitle") : t("home.position.netDeficit")}
        </p>
      </button>

      {/* Score ring — taps to Score Detail */}
      <button
        type="button"
        className="ct-pressable ct-row gap-3 items-center mt-4 pt-3 w-full text-left"
        style={{ background: "none", border: "none", borderTop: "0.5px solid rgba(255,255,255,0.06)", padding: "12px 0 0" }}
        onClick={() => navigate("/insights?card=score")}
      >
        <div
          className="shrink-0"
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: `conic-gradient(${scoreColor} 0deg ${(score / 100) * 360}deg, rgba(255,255,255,0.08) ${(score / 100) * 360}deg 360deg)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "var(--pos-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span className="text-sm font-bold">{formatScore(score)}</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{stability?.label || meta.label}</p>
          <p className="ct-caption mt-0.5">
            {trendChip} · {t("home.position.scoreLabel")}
          </p>
        </div>
        <span style={{ fontSize: 10, color: "var(--pos-text-muted)", opacity: 0.7, flexShrink: 0, marginLeft: 6 }}>{t("home.position.tapScore")}</span>
      </button>
    </div>
  );
}
