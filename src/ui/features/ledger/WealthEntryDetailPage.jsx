import { useMemo, useState, useEffect, useCallback } from "react";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { usePrivacyAmount } from "../../../hooks/usePrivacyAmount.js";
import { buildWealthEntryIntel } from "../../../engines/wealthEntryIntel.js";
import { fetchAssetInsight, fetchPropertyValueHistory, ASSET_AI_INSIGHT_TYPES, resolveAssetInsightError, clearPropertyAiCache } from "../../../services/ai/assetInsight.js";
import { expandMilestonesToSeries } from "../../../utils/netWorth/propertyValueHistory.js";
import WealthEntryModal from "../netWorth/WealthEntryModal.jsx";
import MarketAnalysis from "./MarketAnalysis.jsx";
import { EngineGuard } from "../../primitives/EngineGuard.jsx";
import ValueHistoryChart from "./ValueHistoryChart.jsx";

import PropertyDetailSections from "./detail/PropertyDetailSections.jsx";
import EditorialSubMasthead from "../../patterns/EditorialSubMasthead.jsx";
import GoldDetailSections from "./detail/GoldDetailSections.jsx";
import FdDetailSections from "./detail/FdDetailSections.jsx";
import VehicleDetailSections from "./detail/VehicleDetailSections.jsx";
import LiabilityDetailSections from "./detail/LiabilityDetailSections.jsx";
import StockDetailSections from "./detail/StockDetailSections.jsx";
import MutualFundDetailSections from "./detail/MutualFundDetailSections.jsx";
import CryptoDetailSections from "./detail/CryptoDetailSections.jsx";
import EpfDetailSections from "./detail/EpfDetailSections.jsx";

const HISTORY_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function milestonesToSeries(milestones, entryRow) {
  if (!Array.isArray(milestones) || milestones.length < 2) return null;
  const purchaseYear = Number(entryRow.purchaseYear);
  const area = Number(entryRow.areaMeasure) || 0;
  const currentYear = new Date().getFullYear();
  if (!purchaseYear || purchaseYear >= currentYear || !area) return null;
  const series = expandMilestonesToSeries(
    milestones,
    area,
    purchaseYear,
    currentYear,
    Number(entryRow.purchasePrice) || 0,
  );
  return series.length >= 2 ? series : null;
}

function buildStoredMarketAnalysis(entryRow) {
  const rate = Number(entryRow.marketRatePerSqyd);
  const area = Number(entryRow.areaMeasure) || 0;
  if (!rate || rate <= 0) return null;
  return {
    source: "ai",
    structured: true,
    insight: null,
    marketData: {
      marketRate: { perSqyd: rate, dataSource: "stored" },
      impliedMarketValue: area > 0 ? Math.round(rate * area) : null,
    },
  };
}

/** @route /insights/entry/:id */
export default function WealthEntryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { settings } = usePerovo();
  const { entries, updateEntry } = useNetWorth();
  const { formatAmount } = usePrivacyAmount();
  const [editOpen, setEditOpen] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeErr, setAnalyzeErr] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [liveMarketOpen, setLiveMarketOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const entry = useMemo(() => entries.find((e) => e.id === id), [entries, id]);
  const intel = useMemo(
    () => (entry ? buildWealthEntryIntel(entry, settings) : null),
    [entry, settings],
  );

  const refreshValueHistory = useCallback(
    async (entryRow, marketRatePerSqyd, force = false) => {
      if (!entryRow?.purchaseYear || !entryRow.areaMeasure || !entryRow.location) return;
      if (
        !force &&
        entryRow.valueHistorySeries?.length >= 2 &&
        entryRow.valueHistoryFetchedAt &&
        Date.now() - entryRow.valueHistoryFetchedAt < HISTORY_TTL_MS
      ) {
        return;
      }
      setHistoryLoading(true);
      try {
        const result = await fetchPropertyValueHistory({
          categoryId: entryRow.categoryId,
          name: entryRow.name,
          location: entryRow.location,
          latitude: entryRow.latitude,
          longitude: entryRow.longitude,
          purchaseYear: entryRow.purchaseYear,
          purchaseMonth: entryRow.purchaseMonth,
          purchasePrice: entryRow.purchasePrice,
          purchaseRatePerUnit: entryRow.purchaseRatePerUnit,
          currentValue: entryRow.value,
          marketRatePerSqyd: marketRatePerSqyd ?? entryRow.marketRatePerSqyd,
          areaMeasure: entryRow.areaMeasure,
          areaUnit: entryRow.areaUnit,
        });
        if (result.ok && result.series?.length) {
          await updateEntry(entryRow.id, {
            valueHistorySeries: result.series,
            valueHistoryFetchedAt: Date.now(),
          });
        }
      } finally {
        setHistoryLoading(false);
      }
    },
    [updateEntry],
  );

  const saveHistoryFromMilestones = useCallback(
    async (entryRow, milestones) => {
      const series = milestonesToSeries(milestones, entryRow);
      if (!series) return false;
      await updateEntry(entryRow.id, {
        valueHistorySeries: series,
        valueHistoryFetchedAt: Date.now(),
      });
      return true;
    },
    [updateEntry],
  );

  const applyAnalysisResult = useCallback(
    async (result, entryRow) => {
      if (result.source === "error") {
        setAnalysis(null);
        setAnalyzeErr(resolveAssetInsightError(t, result));
        return;
      }
      setAnalyzeErr("");
      setAnalysis(result);
      if (
        entryRow?.categoryId?.startsWith("property") &&
        result.source === "ai"
      ) {
        if (result.milestones?.length) {
          await saveHistoryFromMilestones(entryRow, result.milestones);
        } else if (result.marketData) {
          const rate = result.marketData?.marketRate?.perSqyd;
          await refreshValueHistory(entryRow, rate != null ? Number(rate) : undefined);
        }
      }
      if (entryRow?.categoryId === "stocks" && result.source === "ai" && result.marketData?.currentPrice) {
        const price = Number(result.marketData.currentPrice);
        const qty = Number(entryRow.quantity) || 0;
        if (price > 0) {
          await updateEntry(entryRow.id, {
            lastLivePrice: price,
            livePriceFetchedAt: Date.now(),
            ...(qty > 0 ? { value: Math.round(price * qty) } : {}),
          });
        }
      }
    },
    [t, refreshValueHistory, saveHistoryFromMilestones, updateEntry],
  );

  useEffect(() => {
    queueMicrotask(() => {
      setLiveMarketOpen(false);
      setAnalysis(null);
      setAnalyzeErr("");
      setHistoryLoading(false);
    });
  }, [id]);

  if (!entry || !intel) {
    return (
      <div className="ed-page-full ed-ins-page">
        <EditorialSubMasthead
          title={t("wealthDetail.notFound")}
          onBack={() => navigate(-1)}
          backLabel={t("insights.subpages.back")}
        />
      </div>
    );
  }

  const isAsset = entry.kind === "asset";
  const valueColor = isAsset ? "var(--ed-green)" : "var(--ed-red)";
  const chartColor = intel?.chartColor || (isAsset ? "var(--ed-gold)" : "var(--ed-red)");
  const hasAiInsight = ASSET_AI_INSIGHT_TYPES.includes(entry.categoryId);
  const isAutoEstimated = Boolean(entry.valueAutoEstimated);

  const handleOpenLiveMarket = () => {
    setLiveMarketOpen(true);
    const stored = buildStoredMarketAnalysis(entry);
    if (stored && !analysis) {
      setAnalysis(stored);
      return;
    }
    if (!analysis && !analyzing) handleAnalyze(false);
  };

  const handleAnalyze = async (force = false) => {
    setAnalyzing(true);
    setAnalyzeErr("");
    try {
      const needsHistory = !entry.valueHistorySeries?.length;
      if (force && entry.categoryId?.startsWith("property")) {
        clearPropertyAiCache(entry, needsHistory ? { withHistory: true } : {});
      }
      const result = await fetchAssetInsight(entry, t, settings, {
        includeValueHistory: needsHistory,
      });
      await applyAnalysisResult(result, entry);
    } catch {
      setAnalyzeErr(t("wealthDetail.market.failed"));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAcceptMarketValue = async (impliedValue) => {
    if (!impliedValue || accepting) return;
    setAccepting(true);
    try {
      const rate = analysis?.marketData?.marketRate?.perSqyd;
      const growth = analysis?.marketData?.trend?.annualGrowthPct;
      const updated = {
        ...entry,
        value: impliedValue,
        marketRatePerSqyd: rate != null ? Math.round(Number(rate)) : entry.marketRatePerSqyd,
      };
      await updateEntry(entry.id, {
        value: impliedValue,
        valueAutoEstimated: false,
        marketRatePerSqyd: updated.marketRatePerSqyd,
        marketAnnualGrowthPct: growth != null ? Number(growth) : entry.marketAnnualGrowthPct,
        valueAiFetchedAt: Date.now(),
        valueHistorySeries: undefined,
        valueHistoryFetchedAt: undefined,
      });
      if (analysis?.milestones?.length) {
        await saveHistoryFromMilestones(updated, analysis.milestones);
      } else {
        await refreshValueHistory(updated, rate != null ? Number(rate) : undefined, true);
      }
    } finally {
      setAccepting(false);
    }
  };

  const impliedMarketValue =
    analysis?.marketData?.impliedMarketValue || analysis?.marketData?.impliedCurrentValue || null;

  const hasStoredRate = Number(entry.marketRatePerSqyd) > 0;
  const hasLiveMarket =
    (analysis?.source === "ai" &&
      analysis?.structured &&
      Boolean(analysis?.marketData)) ||
    hasStoredRate;

  const marketIntroKey = entry.categoryId.startsWith("property")
    ? "wealthDetail.market.intro.property"
    : entry.categoryId === "gold"
      ? "wealthDetail.market.intro.gold"
      : entry.categoryId === "vehicle"
        ? "wealthDetail.market.intro.vehicle"
        : entry.categoryId === "stocks"
          ? "wealthDetail.market.intro.stock"
          : entry.categoryId === "mutual_fund" || entry.categoryId === "sip"
            ? "wealthDetail.market.intro.mf"
            : entry.categoryId === "crypto"
              ? "wealthDetail.market.intro.crypto"
              : "wealthDetail.market.intro.generic";

  const tierLabel =
    intel?.propertyIntel?.tier === "metro"
      ? t("wealthDetail.property.tierMetro")
      : intel?.propertyIntel?.tier === "tier2"
        ? t("wealthDetail.property.tier2")
        : t("wealthDetail.property.tier3");

  return (
    <div className="ed-page-full ed-ins-page">
      <EditorialSubMasthead
        title={entry.name}
        tagline={t(intel.categoryLabelKey)}
        onBack={() => navigate(-1)}
        backLabel={t("insights.subpages.back")}
        right={
          <button type="button" className="ed-ins-link" onClick={() => setEditOpen(true)}>
            {t("common.edit")}
          </button>
        }
      />

      {isAutoEstimated ? (
        <div className="ed-est-banner">
          <span className="ed-est-banner-icon" aria-hidden="true">
            <CtIcon name="warning" size={14} aria-hidden="true" />
          </span>
          <div className="ed-est-banner-body">
            <div className="ed-est-banner-title">{t("wealthDetail.estimated.bannerTitle")}</div>
            <div className="ed-est-banner-text">{t("wealthDetail.estimated.bannerIntro")}</div>
          </div>
        </div>
      ) : null}

      <div className="ed-ins-story">
        <div className="ed-ins-kicker">{t("wealthDetail.currentValue")}</div>
        <div className="ed-ins-bignum" style={{ color: valueColor }}>
          {formatAmount(entry.value || 0)}
        </div>
        {intel.yearsHeld != null ? (
          <div className="ed-ins-body">
            {t("wealthDetail.heldYears", {
              years: intel.yearsHeld,
              unit: intel.yearsHeld === 1 ? t("wealthDetail.year") : t("wealthDetail.years"),
            })}
            {intel.purchaseYear ? t("wealthDetail.heldSince", { year: intel.purchaseYear }) : ""}
          </div>
        ) : null}
        <ValueHistoryChart
          series={intel.valueSeries}
          milestones={intel.chartMilestones}
          color={chartColor}
          formatAmount={formatAmount}
          t={t}
          areaUnit={entry.areaUnit || "sqyd"}
          caption={
            historyLoading
              ? t("wealthDetail.graph.fetching")
              : intel.valueSeriesSource === "ai"
                ? t("wealthDetail.graph.aiHistory")
                : intel.isProperty
                  ? t("wealthDetail.graph.linearFallback")
                  : undefined
          }
        />
      </div>

      {(intel.cagr != null || intel.gain != null) && (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("wealthDetail.growth")}</div>
          <div className="ed-ins-cols">
            {intel.cagr != null ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("wealthDetail.cagr")}</span>
                <span className="ed-ins-col-val" style={{ color: intel.cagr >= 0 ? "var(--ed-green)" : "var(--ed-red)" }}>
                  {intel.cagr >= 0 ? "+" : ""}
                  {intel.cagr.toFixed(1)}%
                </span>
                <span className="ed-ins-col-meta">{t("wealthDetail.growth.annualMeta")}</span>
              </div>
            ) : null}
            {intel.gain != null ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("wealthDetail.totalGain")}</span>
                <span className="ed-ins-col-val" style={{ color: intel.gain >= 0 ? "var(--ed-green)" : "var(--ed-red)" }}>
                  {formatAmount(intel.gain)}
                </span>
                {intel.gainPct != null ? (
                  <span className="ed-ins-col-meta">
                    {t("wealthDetail.returnPct", {
                      pct: `${intel.gainPct >= 0 ? "+" : ""}${intel.gainPct}`,
                    })}
                  </span>
                ) : null}
              </div>
            ) : null}
            {intel.purchasePrice > 0 ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("wealthDetail.purchasePrice")}</span>
                <span className="ed-ins-col-val">{formatAmount(intel.purchasePrice)}</span>
                <span className="ed-ins-col-meta">{intel.purchaseYear || "—"}</span>
              </div>
            ) : null}
          </div>
          {isAutoEstimated && !analysis ? (
            <p className="ed-ins-body" style={{ marginTop: 10, color: "var(--ed-red)", fontSize: 11 }}>
              {t("wealthDetail.estimated.growthWarning")}
            </p>
          ) : null}
          {isAutoEstimated && impliedMarketValue ? (
            <p className="ed-ins-body" style={{ marginTop: 10, color: "var(--ed-green)", fontSize: 11 }}>
              {t("wealthDetail.estimated.growthReady")}
            </p>
          ) : null}
        </div>
      )}

      {intel.isProperty ? (
        <PropertyDetailSections
          entry={entry}
          intel={intel}
          formatAmount={formatAmount}
          t={t}
          tierLabel={tierLabel}
          onEditPin={() => setEditOpen(true)}
        />
      ) : null}

      {intel.goldIntel ? (
        <GoldDetailSections entry={entry} intel={intel} formatAmount={formatAmount} t={t} />
      ) : null}

      {intel.stockIntel ? (
        <StockDetailSections entry={entry} intel={intel} formatAmount={formatAmount} t={t} />
      ) : null}

      {intel.mfIntel ? (
        <MutualFundDetailSections entry={entry} intel={intel} formatAmount={formatAmount} t={t} />
      ) : null}

      {intel.cryptoIntel ? (
        <CryptoDetailSections entry={entry} intel={intel} formatAmount={formatAmount} t={t} />
      ) : null}

      {intel.epfIntel ? (
        <EpfDetailSections entry={entry} intel={intel} formatAmount={formatAmount} t={t} />
      ) : null}

      {intel.fdIntel ? (
        <FdDetailSections entry={entry} intel={intel} formatAmount={formatAmount} t={t} />
      ) : null}

      {intel.isVehicle ? (
        <VehicleDetailSections entry={entry} intel={intel} formatAmount={formatAmount} t={t} />
      ) : null}

      {entry.kind === "liability" ? (
        <LiabilityDetailSections entry={entry} intel={intel} formatAmount={formatAmount} t={t} />
      ) : null}

      {intel.isInstrument && intel.instrumentMaturityYears != null ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("wealthDetail.instrument.title")}</div>
          <p className="ed-ins-body">
            {t("wealthDetail.instrument.maturityYears", { years: intel.instrumentMaturityYears })}
          </p>
        </div>
      ) : null}

      {entry.notes ? (
        <div className="ed-ins-story" style={{ borderBottom: "none" }}>
          <div className="ed-ins-kicker">{t("netWorth.form.notes")}</div>
          <p className="ed-ins-body">{entry.notes}</p>
        </div>
      ) : null}

      {hasAiInsight ? (
        <div className="ed-ins-story ed-live-market-wrap" style={{ borderBottom: "none" }}>
          {!liveMarketOpen ? (
            <button type="button" className="ed-live-market-trigger" onClick={handleOpenLiveMarket}>
              <span className="ed-live-market-trigger-label">
                {hasStoredRate ? t("wealthDetail.market.refresh") : t("wealthDetail.market.analyse")}
              </span>
              <span className="ed-live-market-trigger-sub">
                {t(marketIntroKey, {
                  location: entry.location || t("wealthDetail.property.outlookAreaFallback"),
                })}
              </span>
            </button>
          ) : (
            <>
              <div className="ed-live-market-head">
                <div className="ed-ins-kicker" style={{ marginBottom: 0 }}>
                  {t("wealthDetail.market.liveTitle")}
                </div>
                <button type="button" className="ed-ins-link" onClick={() => setLiveMarketOpen(false)}>
                  {t("wealthDetail.market.hide")}
                </button>
              </div>

              {analyzing ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0 4px" }}>
                  <div className="ed-market-spinner" aria-hidden="true" />
                  <span className="ed-ins-body">
                    {t("wealthDetail.estimated.searchingGoogle", {
                      location: entry.location || t("wealthDetail.property.outlookAreaFallback"),
                    })}
                  </span>
                </div>
              ) : null}

              {analyzeErr && !analyzing ? (
                <>
                  <p className="ed-you-note error" style={{ marginTop: 10 }}>
                    {analyzeErr}
                  </p>
                  <button type="button" className="ed-you-save" style={{ marginTop: 8 }} onClick={() => handleAnalyze(true)}>
                    {t("wealthDetail.estimated.retry")}
                  </button>
                </>
              ) : null}

              {hasLiveMarket && !analyzing ? (
                <>
                  <EngineGuard>
                    <MarketAnalysis
                      t={t}
                      marketData={
                        analysis.marketData ||
                        (hasStoredRate
                          ? {
                              marketRate: { perSqyd: entry.marketRatePerSqyd, dataSource: "stored" },
                              impliedMarketValue:
                                Number(entry.areaMeasure) > 0
                                  ? Math.round(Number(entry.marketRatePerSqyd) * Number(entry.areaMeasure))
                                  : null,
                            }
                          : null)
                      }
                      categoryId={entry.categoryId}
                      insight={analysis.insight}
                      source={analysis.source}
                      formatAmount={formatAmount}
                      areaMeasure={entry.areaMeasure}
                    />
                  </EngineGuard>

                  {isAutoEstimated && impliedMarketValue > 0 ? (
                    <div
                      className="ed-ins-story"
                      style={{ background: "rgba(94,199,149,0.06)", borderColor: "var(--ed-green)" }}
                    >
                      <div className="ed-ins-kicker" style={{ color: "var(--ed-green)" }}>
                        {t("wealthDetail.estimated.updateTitle")}
                      </div>
                      <div className="ed-ins-cols" style={{ marginBottom: 12 }}>
                        <div className="ed-ins-col">
                          <span className="ed-ins-col-label">{t("wealthDetail.estimated.autoLabel")}</span>
                          <span className="ed-ins-col-val" style={{ color: "var(--ed-red)" }}>
                            {formatAmount(entry.value)}
                          </span>
                        </div>
                        <div className="ed-ins-col">
                          <span className="ed-ins-col-label">
                            {t("wealthDetail.estimated.marketLabel", {
                              source: analysis.marketData?.marketRate?.dataSource
                                ? t("wealthDetail.estimated.marketSource", {
                                    source: analysis.marketData.marketRate.dataSource,
                                  })
                                : "",
                            })}
                          </span>
                          <span className="ed-ins-col-val" style={{ color: "var(--ed-green)" }}>
                            {formatAmount(impliedMarketValue)}
                          </span>
                        </div>
                      </div>
                      <p className="ed-ins-body" style={{ marginBottom: 12 }}>
                        {t("wealthDetail.estimated.acceptHint")}
                      </p>
                      <button
                        type="button"
                        className="ed-accept-btn"
                        disabled={accepting}
                        onClick={() => handleAcceptMarketValue(impliedMarketValue)}
                      >
                        {accepting
                          ? t("wealthDetail.estimated.accepting")
                          : t("wealthDetail.estimated.acceptBtn", { amount: formatAmount(impliedMarketValue) })}
                      </button>
                      <p className="ed-ins-body" style={{ marginTop: 8, fontSize: 11 }}>
                        {t("wealthDetail.estimated.acceptFooter")}
                      </p>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    className="ed-ins-link"
                    style={{ padding: "10px 0 0", display: "block" }}
                    onClick={() => handleAnalyze(true)}
                  >
                    {t("wealthDetail.market.refresh")}
                  </button>
                </>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      <WealthEntryModal
        open={editOpen}
        kind={entry.kind}
        entry={entry}
        onClose={() => setEditOpen(false)}
        onSave={(payload) => updateEntry(entry.id, payload)}
      />
    </div>
  );
}
