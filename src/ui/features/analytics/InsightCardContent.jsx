import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { usePerovoScore } from "../../../hooks/usePerovoScore.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { usePrivacyAmount } from "../../../hooks/usePrivacyAmount.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { isInstrumentWealthEntry } from "../../../utils/ledger/ledgerBuckets.js";
import { ASSET_CATEGORIES } from "../../../constants/netWorth/wealthCategories.js";
import { computeAssetCagr } from "../../../utils/netWorth/physicalAssetHelpers.js";
import { formatInr } from "../../../constants/symbols.js";
import { PEROVO_PILLARS } from "../../../constants/metricTaxonomy.js";
import { ViewLink } from "../../patterns/ViewLink.jsx";
import { ShareScoreIconButton } from "../../patterns/ShareScoreIconButton.jsx";
import FinancialPulseCard from "../dashboard/FinancialPulseCard.jsx";
import AnalyticsChartPanel from "./AnalyticsChartPanel.jsx";
import MonthlySpendAnalyticsSection from "./MonthlySpendAnalyticsSection.jsx";
import BillInsightsCards from "./BillInsightsCards.jsx";
import PaycheckBreakdown from "./PaycheckBreakdown.jsx";
import { totalPaidOnPayments } from "../../../utils/commitmentPayments.js";
import { yearlyBurdenFromCommitments } from "../../../engines/analyticsSeries.js";
import { INSIGHT_BORDERS, INSIGHT_GLOWS, INSIGHT_GRADIENTS } from "./insightCarouselConfig.js";

const EMI_CATEGORIES = new Set(["Home Loan", "Car Loan", "EMI", "Personal Loan", "Credit Card", "Loan"]);

function wealthCategoryLabel(t, categoryId) {
  const def = ASSET_CATEGORIES.find((c) => c.id === categoryId);
  return def ? t(def.labelKey) : categoryId;
}

function tierRingColor(tone) {
  if (tone === "success" || tone === "ok") return "#2dd4bf";
  if (tone === "warning" || tone === "warn" || tone === "mid") return "#fbbf24";
  return "#f87171";
}

function pillarStatusKey(pillarId, score, survivalMonths, debtRatio, goalsRatio) {
  if (pillarId === "cashflow") {
    if (score >= 55) return "scoreDetail.pillarStatus.onTrack";
    if (score >= 35) return "scoreDetail.pillarStatus.watch";
    return "scoreDetail.pillarStatus.atRisk";
  }
  if (pillarId === "savings") {
    const mo = survivalMonths ?? 0;
    if (mo >= 6) return "scoreDetail.pillarStatus.strong";
    if (mo >= 3) return "scoreDetail.pillarStatus.moderate";
    return "scoreDetail.pillarStatus.low";
  }
  if (pillarId === "debt") {
    if (debtRatio < 30) return "scoreDetail.pillarStatus.healthy";
    if (debtRatio < 60) return "scoreDetail.pillarStatus.watch";
    return "scoreDetail.pillarStatus.high";
  }
  if (goalsRatio >= 0.8) return "scoreDetail.pillarStatus.onTrack";
  return "scoreDetail.pillarStatus.behind";
}

function monthlyEmi(commitment) {
  return Number(commitment.monthlyAmount || commitment.emiAmount || commitment.amount) || 0;
}

function ScoreInsightCard({ hideBreakdown = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const perovo = usePerovoScore();
  const stable = useStabilityIntel();
  const { formatScore } = usePrivacyAmount();
  const { core } = useNetWorth();

  const score = perovo.score ?? 0;
  const ringColor = tierRingColor(perovo.tier?.tone);
  const filledDeg = Math.max(0, Math.min(360, (score / 100) * 360));
  const survivalMonths = stable.survival?.survivalMonths ?? perovo.survivalMonths ?? 0;
  const totalAssets = core?.totalAssets ?? 0;
  const totalLiabilities = core?.totalLiabilities ?? 0;
  const debtRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
  const goalsOnTrackRatio =
    perovo.pillars?.protection?.score != null ? Math.min(1, perovo.pillars.protection.score / 100) : 0.5;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            flexShrink: 0,
            background: `conic-gradient(${ringColor} 0deg ${filledDeg}deg, rgba(255,255,255,0.06) ${filledDeg}deg 360deg)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 62,
              height: 62,
              borderRadius: "50%",
              background: "var(--ct-bg)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 700, color: "var(--ct-text)", fontVariantNumeric: "tabular-nums" }}>
              {formatScore(score)}
            </span>
            <span style={{ fontSize: 9, color: ringColor }}>{t(`perovoScore.tier.${perovo.tier?.id}`)}</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ct-text)" }}>{t("perovoScore.title")}</div>
            <ShareScoreIconButton size={17} />
          </div>
          <div style={{ fontSize: 12, color: "var(--ct-text-muted)", marginTop: 3 }}>{t("analytics.insightScore.subtitle")}</div>
          {!hideBreakdown ? (
            <button
              type="button"
              className="ct-btn ct-btn-ghost"
              style={{ marginTop: 8, padding: "4px 10px", fontSize: 11 }}
              onClick={() => navigate("/insights/score")}
            >
              {t("scoreDetail.fullBreakdown")}
            </button>
          ) : null}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {PEROVO_PILLARS.map((pillar) => {
          const pillarData = perovo.pillars[pillar.id];
          const pillarScore = pillarData?.score ?? 0;
          const color = tierRingColor(pillarScore >= 70 ? "success" : pillarScore >= 45 ? "warning" : "danger");
          let displayValue = `${pillarScore}`;
          if (pillar.id === "debt") displayValue = `${debtRatio.toFixed(0)}%`;
          if (pillar.id === "savings" && survivalMonths != null) {
            displayValue = `${Number(survivalMonths).toFixed(1)}${t("scoreDetail.monthsShort")}`;
          }
          return (
            <div
              key={pillar.id}
              style={{
                background: "rgba(255,255,255,0.05)",
                borderRadius: 10,
                padding: "8px 10px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 10, color: "var(--ct-text-muted)" }}>{t(`perovoScore.pillar.${pillar.id}`)}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color, marginTop: 2 }}>{displayValue}</div>
              <div style={{ fontSize: 9, color: "var(--ct-text-muted)" }}>
                {t(pillarStatusKey(pillar.id, pillarScore, survivalMonths, debtRatio, goalsOnTrackRatio))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function AssetsInsightCard({ hideBreakdown = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { entries, core } = useNetWorth();
  const { formatAmount } = usePrivacyAmount();

  const assetEntries = useMemo(
    () => entries.filter((e) => e.kind === "asset" && !isInstrumentWealthEntry(e)),
    [entries],
  );
  const totalAssets = core?.totalAssets ?? 0;

  const topAsset = useMemo(() => {
    const withCagr = assetEntries
      .map((e) => {
        const cagr = computeAssetCagr(e.purchasePrice, e.purchaseYear, e.value);
        return cagr != null ? { ...e, cagr } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.cagr - a.cagr);
    return withCagr[0] ?? null;
  }, [assetEntries]);

  const insightSnippet = topAsset?.aiInsight
    ? topAsset.aiInsight.split("VERDICT:")[1]?.split("\n")[0]?.trim() || topAsset.aiInsight.slice(0, 80)
    : null;

  return (
    <>
      <div style={{ fontSize: 11, color: "var(--ct-text-muted)", marginBottom: 10 }}>
        {t("analytics.insightAssets.total")}{" "}
        <span style={{ color: "#fcd34d", fontWeight: 600 }}>{formatAmount(totalAssets)}</span>
        {t("analytics.insightAssets.across", { count: assetEntries.length })}
      </div>
      {topAsset ? (
        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
          <div
            style={{
              fontSize: 10,
              color: "var(--pos-asset)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 6,
            }}
          >
            {t("analytics.insightAssets.bestPerformer")}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ct-text)" }}>{topAsset.name}</div>
          <div style={{ fontSize: 12, color: "#2dd4bf", marginTop: 3 }}>
            {topAsset.cagr.toFixed(1)}% CAGR
            {topAsset.purchaseYear
              ? ` · ${t("analytics.insightAssets.yearsHeld", { years: new Date().getFullYear() - topAsset.purchaseYear })}`
              : ""}
          </div>
          {insightSnippet ? (
            <div style={{ fontSize: 11, color: "var(--ct-text-muted)", marginTop: 6, fontStyle: "italic" }}>
              ✦ {insightSnippet}
            </div>
          ) : null}
        </div>
      ) : null}
      {assetEntries.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0", color: "var(--ct-text-muted)", fontSize: 13 }}>
          {t("analytics.insightAssets.empty")}
        </div>
      ) : null}
      {!hideBreakdown ? (
        <button
          type="button"
          className="ct-btn ct-btn-ghost"
          style={{ width: "100%", marginTop: 8, fontSize: 12 }}
          onClick={() => navigate("/insights/assets")}
        >
          {t("analytics.insightCardBreakdown")}
        </button>
      ) : null}
    </>
  );
}

export function LiabilitiesInsightCard({ hideBreakdown = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sortedCommitments, settings } = usePerovo();
  const { entries } = useNetWorth();
  const { formatAmount } = usePrivacyAmount();

  const income = combinedMonthlyIncome(settings);
  const emiCommitments = sortedCommitments.filter((c) => EMI_CATEGORIES.has(c.category));
  const totalMonthlyEmi = emiCommitments.reduce((s, c) => s + monthlyEmi(c), 0);
  const emiRatio = income > 0 ? (totalMonthlyEmi / income) * 100 : 0;
  const liabEntries = entries.filter((e) => e.kind === "liability");
  const totalDebt = liabEntries.reduce((s, e) => s + (Number(e.value) || 0), 0);

  const earliest = emiCommitments
    .map((c) => {
      const schedule = c.repaymentSchedule || [];
      const remaining = schedule.length
        ? schedule.filter((r) => r.paymentStatus !== "paid").length
        : null;
      return { c, remaining };
    })
    .filter((x) => x.remaining != null && x.remaining > 0)
    .sort((a, b) => a.remaining - b.remaining)[0];

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, color: "var(--ct-text-muted)" }}>{t("analytics.insightLiabilities.monthlyEmi")}</div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "#f43f5e",
              marginTop: 2,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatAmount(totalMonthlyEmi)}
          </div>
          <div style={{ fontSize: 9, color: "var(--ct-text-muted)", marginTop: 1 }}>
            {t("analytics.insightLiabilities.pctIncome", { pct: emiRatio.toFixed(0) })}
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, color: "var(--ct-text-muted)" }}>{t("analytics.insightLiabilities.totalDebt")}</div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "#fbbf24",
              marginTop: 2,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatAmount(totalDebt)}
          </div>
        </div>
      </div>
      {earliest ? (
        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
          <div
            style={{
              fontSize: 10,
              color: "#2dd4bf",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 4,
            }}
          >
            {t("analytics.insightLiabilities.finishingSoonest")}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ct-text)" }}>{earliest.c.name}</div>
          <div style={{ fontSize: 11, color: "var(--ct-text-muted)", marginTop: 2 }}>
            {t("analytics.insightLiabilities.installmentsLeft", { count: earliest.remaining })}
          </div>
        </div>
      ) : null}
      {!hideBreakdown ? (
        <button
          type="button"
          className="ct-btn ct-btn-ghost"
          style={{ width: "100%", fontSize: 12 }}
          onClick={() => navigate("/insights/liabilities")}
        >
          {t("analytics.insightCardBreakdown")}
        </button>
      ) : null}
    </>
  );
}

export function InstrumentsInsightCard({ hideBreakdown = false, showHoldings = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { entries } = useNetWorth();
  const { formatAmount } = usePrivacyAmount();

  const instruments = useMemo(() => entries.filter(isInstrumentWealthEntry), [entries]);
  const totalValue = instruments.reduce((s, e) => s + (Number(e.value) || 0), 0);
  const sips = instruments.filter((e) => e.categoryId === "sip");
  const sipMonthly = sips.reduce((s, e) => s + (Number(e.emi) || 0), 0);

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "var(--ct-text-muted)", marginBottom: 10 }}>
          {t("analytics.insightInstruments.meta", { count: instruments.length })}{" "}
          <span style={{ color: "#c4b5fd", fontWeight: 600 }}>{formatAmount(totalValue)}</span>
        </div>
        {sipMonthly > 0 ? (
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
            <div
              style={{
                fontSize: 10,
                color: "var(--pos-inst)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 4,
              }}
            >
              {t("analytics.insightInstruments.monthlySip")}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#c4b5fd", fontVariantNumeric: "tabular-nums" }}>
              {formatAmount(sipMonthly)}/mo
            </div>
            <div style={{ fontSize: 11, color: "var(--ct-text-muted)", marginTop: 2 }}>
              {t("analytics.insightInstruments.sipPlans", { count: sips.length })}
            </div>
          </div>
        ) : null}
        {instruments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "var(--ct-text-muted)", fontSize: 13 }}>
            {t("analytics.insightInstruments.empty")}
          </div>
        ) : null}
        {showHoldings && instruments.length > 0 ? (
          <div className="ct-stack gap-2" style={{ marginTop: 12 }}>
            {instruments.map((entry) => (
              <div
                key={entry.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.05)",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ct-text)" }}>{entry.name}</div>
                  <div style={{ fontSize: 11, color: "var(--ct-text-muted)", marginTop: 2 }}>
                    {wealthCategoryLabel(t, entry.categoryId)}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#c4b5fd", fontVariantNumeric: "tabular-nums" }}>
                  {formatAmount(Number(entry.value) || 0)}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {!hideBreakdown ? (
        <button
          type="button"
          className="ct-btn ct-btn-ghost"
          style={{ width: "100%", fontSize: 12 }}
          onClick={() => navigate("/insights/instruments")}
        >
          {t("analytics.insightCardBreakdown")}
        </button>
      ) : null}
    </>
  );
}

function YearlyBurdenInsightCard() {
  const { t } = useTranslation();
  const { commitments, getEffectiveStatus } = usePerovo();
  const { formatAmount } = usePrivacyAmount();
  const yearlyBurden = useMemo(
    () => yearlyBurdenFromCommitments(commitments, getEffectiveStatus),
    [commitments, getEffectiveStatus],
  );

  return (
    <div style={{ textAlign: "center", padding: "24px 0" }}>
      <p className="ct-stat-label">{t("analytics.yearly.burdenCard")}</p>
      <p className="ct-stat-value ct-numeral" style={{ fontSize: 28, marginTop: 8 }}>
        {formatAmount(yearlyBurden)}
      </p>
      <p className="ct-caption mt-2">{t("analytics.yearly.burdenHint")}</p>
    </div>
  );
}

function YearlySpendInsightCard() {
  const { t } = useTranslation();
  const { dailySpends } = usePerovo();
  const { formatAmount } = usePrivacyAmount();
  const year = new Date().getFullYear();

  const yearlyVariable = useMemo(() => {
    return (dailySpends || []).reduce((sum, row) => {
      const d = String(row.date || "");
      if (!d.startsWith(String(year))) return sum;
      return sum + (Number(row.amount) || 0);
    }, 0);
  }, [dailySpends, year]);

  return (
    <div style={{ textAlign: "center", padding: "24px 0" }}>
      <p className="ct-stat-label">{t("analytics.yearly.variableCard")}</p>
      <p className="ct-stat-value ct-numeral" style={{ fontSize: 28, marginTop: 8 }}>
        {formatAmount(yearlyVariable)}
      </p>
      <p className="ct-caption mt-2">{t("analytics.yearly.variableShortHint", { year })}</p>
    </div>
  );
}

export default function InsightCardContent({ card, data, showBreakdownCta = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { accent, kickerKey } = card;
  const borderColor = INSIGHT_BORDERS[accent];
  const gradient = INSIGHT_GRADIENTS[accent];
  const glow = INSIGHT_GLOWS[accent];

  const shell = (children) => (
    <div
      style={{
        borderRadius: 20,
        padding: "18px 16px 16px",
        border: `0.5px solid ${borderColor}`,
        background: gradient,
        position: "relative",
        overflow: "hidden",
        minHeight: 300,
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
          background: `radial-gradient(circle,${glow},transparent 70%)`,
        }}
      />
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: `var(${card.accentVar})`,
          marginBottom: 14,
          position: "relative",
        }}
      >
        {t(kickerKey)}
      </div>
      <div className="relative">{children}</div>
    </div>
  );

  if (card.id === "pulse") {
    return shell(<FinancialPulseCard embedded />);
  }

  if (card.id === "cashflow") {
    return shell(
      <AnalyticsChartPanel
        forecastSeries={data.forecastSeries}
        paymentsData={data.paymentsData}
        pressureTrend={data.pressureTrend}
        dailySpends={data.dailySpends}
      />,
    );
  }

  if (card.id === "spending") {
    return shell(
      <>
        <MonthlySpendAnalyticsSection embedded>
          <BillInsightsCards />
        </MonthlySpendAnalyticsSection>
        <div className="mt-2">
          <ViewLink label={t("analytics.viewSpendingHistory")} onClick={() => navigate("/ledger/spends")} />
        </div>
        {data.commitments?.length > 0 ? (
          <p className="ct-caption mt-2">
            {t("analytics.allTimePayments")}{" "}
            {formatInr(data.commitments.reduce((s, c) => s + totalPaidOnPayments(c.payments), 0))}
          </p>
        ) : null}
      </>,
    );
  }

  if (card.id === "paycheck") {
    return shell(
      data.paycheckFlow ? (
        <PaycheckBreakdown
          breakdown={data.paycheckFlow}
          incomeStepLabel={data.incomeLabel}
          incomeEntryBasis={data.incomeEntryBasis}
          payerSplit={data.payerSplitForPaycheck}
          creditCard={data.cardPressureAnalytics}
        />
      ) : (
        <p className="ct-caption">{t("scoreDetail.setIncomeHint")}</p>
      ),
    );
  }

  if (card.id === "score") return shell(<ScoreInsightCard hideBreakdown={showBreakdownCta} />);
  if (card.id === "assets") return shell(<AssetsInsightCard hideBreakdown={showBreakdownCta} />);
  if (card.id === "liabilities") return shell(<LiabilitiesInsightCard hideBreakdown={showBreakdownCta} />);
  if (card.id === "instruments") return shell(<InstrumentsInsightCard hideBreakdown={showBreakdownCta} />);
  if (card.id === "yearly-burden") return shell(<YearlyBurdenInsightCard />);
  if (card.id === "yearly-spend") return shell(<YearlySpendInsightCard />);

  return null;
}
