import { useMemo } from "react";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../../context/PerovoContext.jsx";
import { useNetWorth } from "../../../../context/NetWorthContext.jsx";
import { useCommitIntel } from "../../../../hooks/useCommitIntel.js";
import { usePrivacyAmount } from "../../../../hooks/usePrivacyAmount.js";
import { computeSafeToSpendDaily } from "../../../../engines/safeToSpend.js";
import { computeDiversificationScore } from "../../../../engines/netWorth/diversificationScore.js";
import { computeAssetLiabilityMatch } from "../../../../engines/netWorth/assetLiabilityMatch.js";
import { computeNetWorthStressTest } from "../../../../engines/netWorth/stressTest.js";
import { buildQuarterlyNarrative } from "../../../../engines/quarterlyNarrative.js";
import { scanDocumentExpiry } from "../../../../engines/documentExpiryRadar.js";
import { buildBillNegotiationScorecard } from "../../../../engines/billNegotiationScorecard.js";
import { billPriceCreepReport } from "../../../../engines/subscriptionLeak.js";
import { resolveEmergencyLiquidPool } from "../../../../utils/emergencyLiquid.js";
import { wealthCategoryLabel } from "../../../../utils/netWorth/wealthCategoryLabel.js";
import { FlexibleDataChart } from "../../analytics/charts/FlexibleDataChart.jsx";
import { useResolvedTheme } from "../../../../hooks/useResolvedTheme.js";
import { InsightsBreakdownShell } from "./_shared.jsx";

const CATEGORY_VALUE_IDS = {
  property: ["property_residential", "property_land", "property_commercial"],
  gold: ["gold"],
  stocks: ["stocks"],
};

function sumByCategoryIds(assets, ids) {
  return assets
    .filter((a) => ids.includes(a.categoryId))
    .reduce((s, a) => s + (Number(a.value) || 0), 0);
}

export default function AdvancedInsightsPage() {
  const { t } = useTranslation();
  const { commitments, settings, todayStr, monthlySnapshots } = usePerovo();
  const { entries } = useNetWorth();
  const { freeMoneyAfterBurden, income } = useCommitIntel();
  const { formatAmount } = usePrivacyAmount();
  const theme = useResolvedTheme();

  const assets = useMemo(() => entries.filter((e) => e.kind === "asset" && !e.hidden), [entries]);
  const liabilities = useMemo(() => entries.filter((e) => e.kind === "liability" && !e.hidden), [entries]);

  const safeToSpend = useMemo(
    () =>
      computeSafeToSpendDaily({
        bufferAfterBills: freeMoneyAfterBurden,
        salaryCreditDay: settings.salaryCreditDay,
        todayStr,
      }),
    [freeMoneyAfterBurden, settings.salaryCreditDay, todayStr],
  );

  const diversification = useMemo(() => computeDiversificationScore(assets), [assets]);
  const diversificationChartData = useMemo(
    () => diversification.byCategory.map((c) => ({ name: wealthCategoryLabel(t, c.categoryId), value: c.value })),
    [diversification.byCategory, t],
  );
  const debtMatch = useMemo(() => computeAssetLiabilityMatch(assets, liabilities), [assets, liabilities]);
  const debtBackingChartData = useMemo(
    () => [
      { name: t("insights.advanced.backedDebt"), value: debtMatch.backedDebt },
      { name: t("insights.advanced.unbackedDebt"), value: debtMatch.unbackedDebt },
    ],
    [debtMatch.backedDebt, debtMatch.unbackedDebt, t],
  );

  const stressTest = useMemo(() => {
    const monthlyBurden = Math.max(0, income - freeMoneyAfterBurden);
    return computeNetWorthStressTest({
      income,
      freeMoney: freeMoneyAfterBurden,
      liquidSavings: resolveEmergencyLiquidPool(settings, entries),
      monthlyBurden,
      propertyValue: sumByCategoryIds(assets, CATEGORY_VALUE_IDS.property),
      goldValue: sumByCategoryIds(assets, CATEGORY_VALUE_IDS.gold),
      stockValue: sumByCategoryIds(assets, CATEGORY_VALUE_IDS.stocks),
    });
  }, [income, freeMoneyAfterBurden, settings, entries, assets]);

  const quarterly = useMemo(
    () =>
      buildQuarterlyNarrative({
        snapshots: /** @type {{ month: string, netWorth: number, totalAssets: number, totalLiabilities: number }[]} */ (
          monthlySnapshots
        ),
        entries,
        commitments,
      }),
    [monthlySnapshots, entries, commitments],
  );

  const expiry = useMemo(() => scanDocumentExpiry(entries, commitments, todayStr), [entries, commitments, todayStr]);
  const negotiation = useMemo(() => buildBillNegotiationScorecard(commitments, todayStr), [commitments, todayStr]);
  const priceCreep = useMemo(() => billPriceCreepReport(commitments), [commitments]);
  const priceCreepRows = priceCreep.rows;

  const stressTestChartData = useMemo(
    () => [
      { name: t("insights.advanced.scenarioBaseline"), value: stressTest.baseline.survivalMonths },
      { name: t("insights.advanced.scenarioJobLoss"), value: stressTest.incomeShocks["job-loss-3m"].survivalMonths },
      { name: t("insights.advanced.scenarioCombinedShort"), value: stressTest.combined.survivalMonths },
    ],
    [stressTest, t],
  );

  const resilienceColor =
    stressTest.resilience === "resilient" ? "var(--ed-green)" : stressTest.resilience === "fragile" ? "var(--ed-gold)" : "var(--ed-red)";

  return (
    <InsightsBreakdownShell title={t("insights.advanced.title")} subtitle={t("insights.advanced.subtitle")}>
      {safeToSpend.daily > 0 ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("insights.advanced.safeToSpendKicker")}</div>
          <div className="ed-ins-bignum">{formatAmount(safeToSpend.daily)}</div>
          <p className="ed-ins-body">{t("insights.advanced.safeToSpendHint", { days: safeToSpend.daysUntilSalary })}</p>
        </div>
      ) : null}

      {quarterly.hasData ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("insights.advanced.quarterlyKicker")}</div>
          <div className="ed-ins-row" style={{ cursor: "default" }}>
            <div className="ed-ins-row-left">
              <div className="ed-ins-row-name">{t("insights.advanced.quarterlyNetWorthChange")}</div>
            </div>
            <div className="ed-ins-row-val" style={{ color: quarterly.direction === "up" ? "var(--ed-green)" : "var(--ed-red)" }}>
              {quarterly.direction === "up" ? "+" : "−"}
              {formatAmount(Math.abs(quarterly.netWorthDelta))}
            </div>
          </div>
          {quarterly.beats.map((beat, i) => (
            <p key={i} className="ed-ins-body">
              {t(beat.key, beat.params)}
            </p>
          ))}
        </div>
      ) : null}

      {diversification.hasData ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("insights.advanced.diversificationKicker")}</div>
          <div className="ed-ins-row" style={{ cursor: "default" }}>
            <div className="ed-ins-row-left">
              <div className="ed-ins-row-name">{t(`insights.advanced.diversificationBand.${diversification.band}`)}</div>
            </div>
            <div className="ed-ins-row-val">{diversification.score}/100</div>
          </div>
          {diversification.topConcentration ? (
            <p className="ed-ins-body">
              {t("insights.advanced.topConcentration", {
                pct: diversification.topConcentration.pct,
                name: diversification.topConcentration.name,
              })}
            </p>
          ) : null}
          {diversificationChartData.length > 1 ? (
            <div className="ed-chart-area" style={{ height: 220, marginTop: 8 }}>
              <FlexibleDataChart data={diversificationChartData} chartType="donut" theme={theme} emptyMessage="" />
            </div>
          ) : null}
        </div>
      ) : null}

      {debtMatch.totalDebt > 0 ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("insights.advanced.debtBackingKicker")}</div>
          <div className="ed-ins-cols">
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("insights.advanced.backedDebt")}</span>
              <span className="ed-ins-col-val" style={{ color: "var(--ed-green)" }}>
                {debtMatch.backedDebtPct}%
              </span>
            </div>
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("insights.advanced.unbackedDebt")}</span>
              <span className="ed-ins-col-val" style={{ color: "var(--ed-red)" }}>
                {formatAmount(debtMatch.unbackedDebt)}
              </span>
            </div>
          </div>
          <div className="ed-chart-area" style={{ height: 180, marginTop: 8 }}>
            <FlexibleDataChart data={debtBackingChartData} chartType="bar" theme={theme} emptyMessage="" />
          </div>
          <p className="ed-ins-body">{t("insights.advanced.debtBackingHint")}</p>
        </div>
      ) : null}

      {stressTest.baseline.survivalMonths > 0 || stressTest.combined.wealthDelta !== 0 ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("insights.advanced.stressTestKicker")}</div>
          <p className="ed-ins-body" style={{ fontWeight: 600, color: resilienceColor }}>
            {t(`insights.advanced.resilience.${stressTest.resilience}`)}
          </p>
          <div className="ed-chart-area" style={{ height: 180 }}>
            <FlexibleDataChart data={stressTestChartData} chartType="bar" theme={theme} emptyMessage="" />
          </div>
          <div className="ed-ins-row" style={{ cursor: "default" }}>
            <div className="ed-ins-row-left">
              <div className="ed-ins-row-name">{t("insights.advanced.scenarioJobLoss")}</div>
            </div>
            <div className="ed-ins-row-val">
              {stressTest.incomeShocks["job-loss-3m"].survivalMonths.toFixed(1)} {t("scoreDetail.monthsShort")}
            </div>
          </div>
          <div className="ed-ins-row" style={{ cursor: "default" }}>
            <div className="ed-ins-row-left">
              <div className="ed-ins-row-name">{t("insights.advanced.scenarioCombinedCrash")}</div>
            </div>
            <div className="ed-ins-row-val" style={{ color: "var(--ed-red)" }}>
              {formatAmount(stressTest.combined.wealthDelta)}
            </div>
          </div>
        </div>
      ) : null}

      {expiry.upcoming.length > 0 || expiry.overdue.length > 0 ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("insights.advanced.expiryKicker")}</div>
          {expiry.overdue.map((item) => (
            <div key={item.id} className="ed-ins-row" style={{ cursor: "default" }}>
              <div className="ed-ins-row-left">
                <div className="ed-ins-row-cat">{t(`insights.advanced.expiryKind.${item.kind}`)}</div>
                <div className="ed-ins-row-name">{item.name}</div>
              </div>
              <div className="ed-ins-row-val danger">{t("insights.advanced.expiredDaysAgo", { days: Math.abs(item.daysUntil) })}</div>
            </div>
          ))}
          {expiry.upcoming.map((item) => (
            <div key={item.id} className="ed-ins-row" style={{ cursor: "default" }}>
              <div className="ed-ins-row-left">
                <div className="ed-ins-row-cat">{t(`insights.advanced.expiryKind.${item.kind}`)}</div>
                <div className="ed-ins-row-name">{item.name}</div>
              </div>
              <div className="ed-ins-row-val">{t("insights.advanced.expiresInDays", { days: item.daysUntil })}</div>
            </div>
          ))}
        </div>
      ) : null}

      {negotiation.rows.length > 0 || priceCreepRows.length > 0 ? (
        <div className="ed-ins-story" style={{ borderBottom: "none" }}>
          <div className="ed-ins-kicker">{t("insights.advanced.savingsKicker")}</div>
          {negotiation.totalEstimatedAnnualSavings > 0 ? (
            <p className="ed-ins-body">
              {t("insights.advanced.negotiationHint", { amount: formatAmount(negotiation.totalEstimatedAnnualSavings) })}
            </p>
          ) : null}
          {negotiation.rows.slice(0, 5).map((row) => (
            <div key={row.id} className="ed-ins-row" style={{ cursor: "default" }}>
              <div className="ed-ins-row-left">
                <div className="ed-ins-row-cat">{row.category}</div>
                <div className="ed-ins-row-name">{row.name}</div>
                <div className="ed-ins-row-sub">{t("insights.advanced.loyalMonths", { months: row.monthsLoyal })}</div>
              </div>
              <div className="ed-ins-row-val">{formatAmount(row.estimatedAnnualSavings)}</div>
            </div>
          ))}
          {priceCreepRows.map((row) => (
            <div key={row.id} className="ed-ins-row" style={{ cursor: "default" }}>
              <div className="ed-ins-row-left">
                <div className="ed-ins-row-cat">{t("insights.advanced.priceCreepLabel")}</div>
                <div className="ed-ins-row-name">{row.name}</div>
              </div>
              <div className="ed-ins-row-val danger">+{row.creepPct}%</div>
            </div>
          ))}
        </div>
      ) : null}
    </InsightsBreakdownShell>
  );
}
