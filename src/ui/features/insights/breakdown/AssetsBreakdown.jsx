import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { useNetWorth } from "../../../../context/NetWorthContext.jsx";
import { usePrivacyAmount } from "../../../../hooks/usePrivacyAmount.js";
import { isCoreAssetEntry } from "../../../../utils/ledger/ledgerBuckets.js";
import { computeAssetCagr } from "../../../../utils/netWorth/physicalAssetHelpers.js";
import { InsightsBreakdownShell, openWealthDetail, rowButtonProps } from "./_shared.jsx";

export default function InsightsAssetsBreakdownPage() {
  const navigate = useNavigate();
  const { entries, core } = useNetWorth();
  const { formatAmount } = usePrivacyAmount();
  const { t } = useTranslation();

  const assetEntries = useMemo(() => entries.filter((e) => isCoreAssetEntry(e)), [entries]);
  const totalAssets = core?.totalAssets ?? 0;

  const withCagr = useMemo(
    () =>
      assetEntries
        .map((e) => {
          const cagr = computeAssetCagr(e.purchasePrice, e.purchaseYear, e.value);
          const yearsHeld = e.purchaseYear ? new Date().getFullYear() - e.purchaseYear : null;
          return { ...e, cagr, yearsHeld };
        })
        .sort((a, b) => (b.value || 0) - (a.value || 0)),
    [assetEntries],
  );

  return (
    <InsightsBreakdownShell
      title={t("insights.subpages.assetsTitle")}
      subtitle={t("insights.subpages.assetsSubtitle")}
    >
      <div className="ed-ins-story">
        <div className="ed-ins-kicker">{t("insights.subpages.totalAssetsKicker")}</div>
        <div className="ed-ins-bignum" style={{ marginBottom: 4 }}>
          {formatAmount(totalAssets)}
        </div>
        <p className="ed-ins-body">
          {assetEntries.length === 1
            ? t("insights.subpages.assetCountOne")
            : t("insights.subpages.assetCount", { count: assetEntries.length })}
        </p>
      </div>

      {withCagr.length > 0 ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("insights.subpages.allHoldings")}</div>
          {withCagr.map((e) => (
            <div
              key={e.id}
              className="ed-ins-row"
              {...rowButtonProps(() => openWealthDetail({ navigate, entryId: e.id }))}
            >
              <div className="ed-ins-row-left">
                <div className="ed-ins-row-cat">
                  {e.categoryId || t("ledger.tab.assets")}
                  {e.cagr != null && e.yearsHeld != null
                    ? ` · ${t("insights.subpages.cagrYearsHeld", {
                        cagr: e.cagr.toFixed(1),
                        years: e.yearsHeld,
                      })}`
                    : null}
                </div>
                <div className="ed-ins-row-name">{e.name}</div>
                {e.aiInsight ? (
                  <div className="ed-ins-row-sub">
                    {e.aiInsight.split("VERDICT:")[1]?.split("\n")[0]?.trim() ||
                      e.aiInsight.slice(0, 80)}
                  </div>
                ) : null}
              </div>
              <div className="ed-ins-row-val" style={{ color: "var(--ed-green)" }}>
                {formatAmount(e.value || 0)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="ed-ins-story">
          <p className="ed-ins-empty">{t("insights.subpages.noAssets")}</p>
        </div>
      )}

      <div className="ed-ins-story" style={{ borderBottom: "none" }}>
        <button
          type="button"
          className="ed-ins-link"
          style={{ padding: 0 }}
          onClick={() => navigate("/ledger?tab=assets")}
        >
          {t("insights.subpages.viewAssetsLedger")}
        </button>
      </div>
    </InsightsBreakdownShell>
  );
}

/** @route /insights/assets */
