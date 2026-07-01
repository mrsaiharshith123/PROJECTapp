import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { usePrivacyAmount } from "../../../hooks/usePrivacyAmount.js";
import { buildWealthEntryIntel } from "../../../engines/wealthEntryIntel.js";
import { fetchAssetInsight, fetchPropertyValueHistory, PHYSICAL_ASSET_TYPES, resolveAssetInsightError } from "../../../services/ai/assetInsight.js";
import { expandMilestonesToSeries } from "../../../utils/netWorth/propertyValueHistory.js";
import WealthEntryModal from "../netWorth/WealthEntryModal.jsx";
import MarketAnalysis from "./MarketAnalysis.jsx";
import ValueHistoryChart from "./ValueHistoryChart.jsx";
import { CtIcon } from "../../icons/CtIcon.jsx";

function verdictPillClass(verdict) {
  if (verdict === "hold" || verdict === "hold_moderate" || verdict === "hold_mature") return "hold";
  if (verdict === "wait") return "wait";
  if (verdict === "review") return "review";
  return "neutral";
}

function verdictLabelKey(verdict) {
  if (verdict === "hold_mature") return "wealthDetail.verdict.holdMature";
  if (verdict === "hold" || verdict === "hold_moderate") return "wealthDetail.verdict.hold";
  if (verdict === "wait") return "wealthDetail.verdict.wait";
  if (verdict === "review") return "wealthDetail.verdict.review";
  return "wealthDetail.verdict.neutral";
}

function Verdict({ t, verdict, reasonKey, reasonParams = undefined }) {
  const reason = reasonKey ? t(reasonKey, reasonParams) : "";
  return (
    <div className="ed-asset-verdict">
      <span className={`ed-asset-verdict-pill ${verdictPillClass(verdict)}`}>{t(verdictLabelKey(verdict))}</span>
      {reason ? <span className="ed-asset-verdict-reason">{reason}</span> : null}
    </div>
  );
}

function PropertyMap({ t, latitude, longitude, name }) {
  const mapRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!latitude || !longitude) return;
    let cancelled = false;
    import("leaflet").then((mod) => {
      if (cancelled) return;
      const L = mod.default;
      if (!L || !mapRef.current || mapRef.current._leaflet_id) return;
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false }).setView(
        [latitude, longitude],
        15,
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:14px;height:14px;border-radius:50%;background:var(--ed-gold);border:2px solid var(--ed-bg);box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
        iconAnchor: [7, 7],
      });
      L.marker([latitude, longitude], { icon }).addTo(map).bindPopup(name || "");
      setLoaded(true);
    }).catch(() => {});
    return () => {
      cancelled = true;
      if (mapRef.current?._leaflet_id) mapRef.current._leaflet_id = undefined;
    };
  }, [latitude, longitude, name]);

  return (
    <div
      className="ed-map-frame"
      ref={mapRef}
      style={{
        background: "var(--ed-rule-soft)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {!loaded ? (
        <span
          style={{
            fontFamily: "'Newsreader', serif",
            fontStyle: "italic",
            fontSize: 13,
            color: "var(--ed-ink-faint)",
          }}
        >
          {t("wealthDetail.map.loading")}
        </span>
      ) : null}
    </div>
  );
}

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

/** @route /insights/entry/:id */
export default function WealthEntryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { settings } = usePerovo();
  const { entries, updateEntry } = useNetWorth();
  const { formatAmount } = usePrivacyAmount();
  const [editOpen, setEditOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
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
    },
    [t, refreshValueHistory, saveHistoryFromMilestones],
  );

  useEffect(() => {
    setLiveMarketOpen(false);
    setAnalysis(null);
    setAnalyzeErr("");
    setHistoryLoading(false);
  }, [id]);

  if (!entry || !intel) {
    return (
      <div className="ct-page ed-paper ed-ins-page">
        <div className="ed-ins-sub-mast">
          <button type="button" className="ed-ins-back" onClick={() => navigate(-1)}>
            {t("insights.subpages.back")}
          </button>
          <h1 className="ed-ins-sub-title">{t("wealthDetail.notFound")}</h1>
        </div>
      </div>
    );
  }

  const isAsset = entry.kind === "asset";
  const valueColor = isAsset ? "var(--ed-green)" : "var(--ed-red)";
  const prop = intel.propertyIntel;
  const gold = intel.goldIntel;
  const fd = intel.fdIntel;
  const isPhysical = PHYSICAL_ASSET_TYPES.includes(entry.categoryId);
  const isAutoEstimated = Boolean(entry.valueAutoEstimated);

  const handleOpenLiveMarket = () => {
    setLiveMarketOpen(true);
    if (!analysis && !analyzing) handleAnalyze();
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalyzeErr("");
    try {
      const needsHistory = !entry.valueHistorySeries?.length;
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

  const hasLiveMarket =
    analysis?.source === "ai" &&
    analysis?.structured &&
    Boolean(analysis?.marketData);

  const marketIntroKey = entry.categoryId.startsWith("property")
    ? "wealthDetail.market.intro.property"
    : entry.categoryId === "gold"
      ? "wealthDetail.market.intro.gold"
      : entry.categoryId === "vehicle"
        ? "wealthDetail.market.intro.vehicle"
        : "wealthDetail.market.intro.generic";

  const tierLabel =
    prop?.tier === "metro"
      ? t("wealthDetail.property.tierMetro")
      : prop?.tier === "tier2"
        ? t("wealthDetail.property.tier2")
        : t("wealthDetail.property.tier3");

  return (
    <div className="ct-page ed-paper ed-ins-page">
      <div className="ed-ins-sub-mast">
        <button type="button" className="ed-ins-back" onClick={() => navigate(-1)}>
          {t("insights.subpages.back")}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="ed-ins-sub-title">{entry.name}</h1>
          <p className="ed-ins-sub-sub">{t(intel.categoryLabelKey)}</p>
        </div>
        <button type="button" className="ed-ins-link" style={{ flexShrink: 0 }} onClick={() => setEditOpen(true)}>
          {t("common.edit")}
        </button>
      </div>

      {isAutoEstimated ? (
        <div className="ed-est-banner">
          <span className="ed-est-banner-icon" aria-hidden="true">
            ⚠
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
          color={valueColor}
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

      {prop ? (
        <>
          <div className="ed-ins-story">
            <div className="ed-ins-kicker">{t("wealthDetail.property.location")}</div>
            {prop.locationLabel ? (
              <div className="ed-ins-body" style={{ marginBottom: 8 }}>
                {prop.locationLabel}
                {" · "}
                <span
                  style={{
                    fontWeight: 600,
                    fontFamily: "'Inter',system-ui,sans-serif",
                    fontSize: 11,
                    color: "var(--ed-ink-faint)",
                  }}
                >
                  {tierLabel}
                </span>
              </div>
            ) : null}
            {prop.ratePerUnit ? (
              <div className="ed-ins-cols" style={{ marginBottom: 10 }}>
                <div className="ed-ins-col">
                  <span className="ed-ins-col-label">{t("wealthDetail.property.area")}</span>
                  <span className="ed-ins-col-val">
                    {prop.ratePerUnit.area} {prop.ratePerUnit.unit}
                  </span>
                </div>
                {prop.ratePerUnit.purchaseRate ? (
                  <div className="ed-ins-col">
                    <span className="ed-ins-col-label">{t("wealthDetail.property.rateAtPurchase")}</span>
                    <span className="ed-ins-col-val">
                      {t("wealthDetail.property.ratePerUnit", {
                        rate: prop.ratePerUnit.purchaseRate.toLocaleString("en-IN"),
                        unit: prop.ratePerUnit.unit,
                      })}
                    </span>
                  </div>
                ) : null}
                {prop.ratePerUnit.currentRate ? (
                  <div className="ed-ins-col">
                    <span className="ed-ins-col-label">{t("wealthDetail.property.rateNow")}</span>
                    <span className="ed-ins-col-val" style={{ color: "var(--ed-green)" }}>
                      {t("wealthDetail.property.ratePerUnit", {
                        rate: prop.ratePerUnit.currentRate.toLocaleString("en-IN"),
                        unit: prop.ratePerUnit.unit,
                      })}
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}
            {prop.hasPin ? (
              <>
                <button type="button" className="ed-map-btn" onClick={() => setShowMap((v) => !v)}>
                  <CtIcon name="map-pin" size={14} />
                  {showMap ? t("wealthDetail.property.hideMap") : t("wealthDetail.property.showMap")}
                </button>
                {showMap ? (
                  <PropertyMap t={t} latitude={prop.latitude} longitude={prop.longitude} name={entry.name} />
                ) : null}
              </>
            ) : (
              <button type="button" className="ed-map-btn" onClick={() => setEditOpen(true)}>
                <CtIcon name="plus" size={14} />
                {t("wealthDetail.property.addMapPin")}
              </button>
            )}
          </div>

          <div className="ed-ins-story">
            <div className="ed-ins-kicker">{t("wealthDetail.property.performance")}</div>
            <div className="ed-ins-cols">
              {prop.cagr != null ? (
                <div className="ed-ins-col">
                  <span className="ed-ins-col-label">{t("wealthDetail.property.yourCagr")}</span>
                  <span className="ed-ins-col-val" style={{ color: prop.cagr >= 8 ? "var(--ed-green)" : "var(--ed-gold)" }}>
                    {prop.cagr}%
                  </span>
                  <span className="ed-ins-col-meta">{t("wealthDetail.property.actualGrowth")}</span>
                </div>
              ) : null}
              {prop.realReturn != null ? (
                <div className="ed-ins-col">
                  <span className="ed-ins-col-label">{t("wealthDetail.property.realReturn")}</span>
                  <span className="ed-ins-col-val" style={{ color: prop.realReturn >= 0 ? "var(--ed-green)" : "var(--ed-red)" }}>
                    {prop.realReturn >= 0 ? "+" : ""}
                    {prop.realReturn}%
                  </span>
                  <span className="ed-ins-col-meta">
                    {t("wealthDetail.property.afterInflation", { pct: prop.inflationPct })}
                  </span>
                </div>
              ) : null}
              {prop.vsBenchmark != null ? (
                <div className="ed-ins-col">
                  <span className="ed-ins-col-label">{t("wealthDetail.property.vsCityAvg")}</span>
                  <span className="ed-ins-col-val" style={{ color: prop.vsBenchmark >= 0 ? "var(--ed-green)" : "var(--ed-red)" }}>
                    {prop.vsBenchmark >= 0 ? "+" : ""}
                    {prop.vsBenchmark}%
                  </span>
                  <span className="ed-ins-col-meta">
                    {t("wealthDetail.property.benchmarkMeta", { pct: prop.benchmarkCagr })}
                  </span>
                </div>
              ) : null}
            </div>
            {prop.inflationAdjustedCost != null ? (
              <p className="ed-ins-body" style={{ marginTop: 10 }}>
                {t("wealthDetail.property.inflationStory", {
                  purchase: formatAmount(prop.purchasePrice),
                  inflationCost: formatAmount(prop.inflationAdjustedCost),
                  current: formatAmount(intel.currentValue),
                  relation:
                    intel.currentValue > prop.inflationAdjustedCost
                      ? t("wealthDetail.property.aheadOfInflation")
                      : t("wealthDetail.property.behindInflation"),
                })}
              </p>
            ) : null}
          </div>

          <div className="ed-ins-story">
            <div className="ed-ins-kicker">{t("wealthDetail.property.holdOrSell")}</div>
            <Verdict t={t} verdict={prop.holdVerdict} reasonKey={prop.holdDetailKey} />
            {prop.sellTimingAdvice ? (
              <p className="ed-ins-body" style={{ marginTop: 8 }}>
                {t(prop.sellTimingAdvice.key, prop.sellTimingAdvice.params)}
              </p>
            ) : null}
          </div>

          {prop.projections?.length > 0 ? (
            <div className="ed-ins-story">
              <div className="ed-ins-kicker">
                {t("wealthDetail.property.projectionTitle", { cagr: prop.cagr })}
              </div>
              {prop.projections.map((p) => (
                <div key={p.years} className="ed-projection-row">
                  <span className="ed-projection-label">
                    {t("wealthDetail.property.projectionYears", { years: p.years })}
                  </span>
                  <span className="ed-projection-val">{formatAmount(p.value)}</span>
                </div>
              ))}
            </div>
          ) : null}

          {prop.capitalGains ? (
            <div className="ed-ins-story">
              <div className="ed-ins-kicker">{t("wealthDetail.property.taxIfSold")}</div>
              <div className="ed-tax-row">
                <span className="ed-tax-label">{t("wealthDetail.property.gain")}</span>
                <span className="ed-tax-val" style={{ color: "var(--ed-green)" }}>
                  {formatAmount(prop.capitalGains.gain)}
                </span>
              </div>
              <div className="ed-tax-row">
                <span className="ed-tax-label">
                  {t("wealthDetail.property.taxType", {
                    type: prop.capitalGains.isLongTerm
                      ? t("wealthDetail.property.taxTypeLtcg")
                      : t("wealthDetail.property.taxTypeStcg"),
                  })}
                </span>
                <span className="ed-tax-val" style={{ color: "var(--ed-red)" }}>
                  {prop.capitalGains.taxRatePct}%
                </span>
              </div>
              <div className="ed-tax-row">
                <span className="ed-tax-label">{t("wealthDetail.property.estimatedTax")}</span>
                <span className="ed-tax-val" style={{ color: "var(--ed-red)" }}>
                  −{formatAmount(prop.capitalGains.taxAmount)}
                </span>
              </div>
              <div className="ed-tax-row" style={{ borderBottom: "none" }}>
                <span className="ed-tax-label">{t("wealthDetail.property.netAfterTax")}</span>
                <span className="ed-tax-val" style={{ color: "var(--ed-green)", fontSize: 18 }}>
                  {formatAmount(prop.capitalGains.netProceeds)}
                </span>
              </div>
              <p className="ed-ins-body" style={{ marginTop: 6 }}>
                {t("wealthDetail.property.taxDisclaimer")}
              </p>
            </div>
          ) : null}

          {prop.yieldPct != null && prop.categoryId !== "property_land" ? (
            <div className="ed-ins-story">
              <div className="ed-ins-kicker">{t("wealthDetail.property.rentalPotential")}</div>
              <div className="ed-ins-cols">
                <div className="ed-ins-col">
                  <span className="ed-ins-col-label">{t("wealthDetail.property.estimatedYield")}</span>
                  <span className="ed-ins-col-val">{prop.yieldPct}%</span>
                  <span className="ed-ins-col-meta">{t("wealthDetail.property.yieldMeta")}</span>
                </div>
                {prop.yieldVsIncome != null ? (
                  <div className="ed-ins-col">
                    <span className="ed-ins-col-label">{t("wealthDetail.property.incomeShare")}</span>
                    <span className="ed-ins-col-val">{prop.yieldVsIncome}%</span>
                    <span className="ed-ins-col-meta">{t("wealthDetail.property.incomeShareMeta")}</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="ed-ins-story" style={{ borderBottom: "none" }}>
            <div className="ed-ins-kicker">{t("wealthDetail.property.areaOutlook")}</div>
            <p className="ed-ins-body">
              {t(prop.developmentOutlookKey, {
                area: prop.outlookArea || t("wealthDetail.property.outlookAreaFallback"),
              })}
            </p>
          </div>
        </>
      ) : null}

      {gold ? (
        <>
          <div className="ed-ins-story">
            <div className="ed-ins-kicker">{t("wealthDetail.gold.title")}</div>
            <div className="ed-ins-cols">
              {gold.weightGrams > 0 ? (
                <div className="ed-ins-col">
                  <span className="ed-ins-col-label">{t("wealthDetail.gold.weight")}</span>
                  <span className="ed-ins-col-val">{gold.weightGrams}g</span>
                  <span className="ed-ins-col-meta">
                    {t("wealthDetail.gold.purityMeta", { karat: gold.purityKarat })}
                  </span>
                </div>
              ) : null}
              {gold.liveRatePerGram > 0 ? (
                <div className="ed-ins-col">
                  <span className="ed-ins-col-label">{t("wealthDetail.gold.todayRate")}</span>
                  <span className="ed-ins-col-val">
                    {t("wealthDetail.gold.ratePerGram", {
                      rate: gold.liveRatePerGram.toLocaleString("en-IN"),
                    })}
                  </span>
                </div>
              ) : null}
              {gold.purchaseRatePerGram ? (
                <div className="ed-ins-col">
                  <span className="ed-ins-col-label">{t("wealthDetail.gold.purchaseRate")}</span>
                  <span className="ed-ins-col-val">
                    {t("wealthDetail.gold.ratePerGram", {
                      rate: gold.purchaseRatePerGram.toLocaleString("en-IN"),
                    })}
                  </span>
                </div>
              ) : null}
            </div>
            {gold.makingChargesEstimate != null ? (
              <p className="ed-ins-body" style={{ marginTop: 8 }}>
                {t("wealthDetail.gold.makingCharges", {
                  pct: gold.makingChargePct,
                  amount: formatAmount(gold.makingChargesEstimate),
                })}
              </p>
            ) : null}
          </div>

          <div className="ed-ins-story">
            <div className="ed-ins-kicker">{t("wealthDetail.gold.performance")}</div>
            <div className="ed-ins-cols">
              {gold.cagr != null ? (
                <div className="ed-ins-col">
                  <span className="ed-ins-col-label">{t("wealthDetail.gold.yourCagr")}</span>
                  <span className="ed-ins-col-val" style={{ color: gold.cagr >= 8 ? "var(--ed-green)" : "var(--ed-gold)" }}>
                    {gold.cagr.toFixed(1)}%
                  </span>
                  <span className="ed-ins-col-meta">
                    {t("wealthDetail.gold.benchmarkMeta", { pct: gold.benchmarkCagr })}
                  </span>
                </div>
              ) : null}
              {gold.realReturn != null ? (
                <div className="ed-ins-col">
                  <span className="ed-ins-col-label">{t("wealthDetail.property.realReturn")}</span>
                  <span className="ed-ins-col-val" style={{ color: gold.realReturn >= 0 ? "var(--ed-green)" : "var(--ed-red)" }}>
                    {gold.realReturn >= 0 ? "+" : ""}
                    {gold.realReturn}%
                  </span>
                  <span className="ed-ins-col-meta">{t("wealthDetail.gold.afterInflation")}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="ed-ins-story">
            <div className="ed-ins-kicker">{t("wealthDetail.gold.holdOrSell")}</div>
            <Verdict
              t={t}
              verdict={gold.holdVerdict}
              reasonKey={gold.holdDetailKey}
              reasonParams={gold.holdDetailParams}
            />
          </div>

          {gold.projections?.length > 0 ? (
            <div className="ed-ins-story">
              <div className="ed-ins-kicker">{t("wealthDetail.gold.projectionTitle")}</div>
              {gold.projections.map((p) => (
                <div key={p.years} className="ed-projection-row">
                  <span className="ed-projection-label">
                    {t("wealthDetail.gold.projectionYears", { years: p.years })}
                  </span>
                  <span className="ed-projection-val">{formatAmount(p.base)}</span>
                  <span className="ed-projection-label" style={{ fontSize: 10 }}>
                    {formatAmount(p.conservative)} – {formatAmount(p.optimistic)}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          {gold.taxIfSoldNow != null ? (
            <div className="ed-ins-story">
              <div className="ed-ins-kicker">{t("wealthDetail.gold.taxIfSold")}</div>
              <div className="ed-tax-row">
                <span className="ed-tax-label">
                  {gold.isLongTerm ? t("wealthDetail.gold.ltcgLabel") : t("wealthDetail.gold.stcgLabel")}
                </span>
                <span className="ed-tax-val" style={{ color: "var(--ed-red)" }}>
                  −{formatAmount(gold.taxIfSoldNow)}
                </span>
              </div>
              <div className="ed-tax-row" style={{ borderBottom: "none" }}>
                <span className="ed-tax-label">{t("wealthDetail.gold.netAfterTax")}</span>
                <span className="ed-tax-val" style={{ color: "var(--ed-green)", fontSize: 18 }}>
                  {formatAmount(gold.netProceedsIfSold)}
                </span>
              </div>
            </div>
          ) : null}

          <div className="ed-ins-story" style={{ borderBottom: "none" }}>
            <div className="ed-ins-kicker">{t("wealthDetail.gold.sgbTitle")}</div>
            <p className="ed-ins-body">{t(gold.sgbNoteKey)}</p>
          </div>
        </>
      ) : null}

      {fd ? (
        <>
          <div className="ed-ins-story">
            <div className="ed-ins-kicker">{t("wealthDetail.fd.returnAnalysis")}</div>
            <div className="ed-ins-cols">
              {fd.interestRate > 0 ? (
                <div className="ed-ins-col">
                  <span className="ed-ins-col-label">{t("wealthDetail.fd.interestRate")}</span>
                  <span className="ed-ins-col-val">{fd.interestRate}%</span>
                  <span className="ed-ins-col-meta">{t("wealthDetail.fd.preTax")}</span>
                </div>
              ) : null}
              {fd.postTaxRate != null ? (
                <div className="ed-ins-col">
                  <span className="ed-ins-col-label">{t("wealthDetail.fd.postTaxRate")}</span>
                  <span className="ed-ins-col-val" style={{ color: fd.postTaxRate > 0 ? "var(--ed-green)" : "var(--ed-red)" }}>
                    {fd.postTaxRate}%
                  </span>
                  <span className="ed-ins-col-meta">
                    {t("wealthDetail.fd.afterTaxMeta", { pct: Math.round(fd.taxSlab * 100) })}
                  </span>
                </div>
              ) : null}
              {fd.realReturn != null ? (
                <div className="ed-ins-col">
                  <span className="ed-ins-col-label">{t("wealthDetail.property.realReturn")}</span>
                  <span className="ed-ins-col-val" style={{ color: fd.realReturn >= 0 ? "var(--ed-green)" : "var(--ed-red)" }}>
                    {fd.realReturn >= 0 ? "+" : ""}
                    {fd.realReturn}%
                  </span>
                  <span className="ed-ins-col-meta">{t("wealthDetail.gold.afterInflation")}</span>
                </div>
              ) : null}
            </div>
          </div>

          {fd.maturityValue != null ? (
            <div className="ed-ins-story">
              <div className="ed-ins-kicker">{t("wealthDetail.fd.maturityProjection")}</div>
              <div className="ed-ins-cols">
                <div className="ed-ins-col">
                  <span className="ed-ins-col-label">{t("wealthDetail.fd.estimatedMaturity")}</span>
                  <span className="ed-ins-col-val" style={{ color: "var(--ed-green)" }}>
                    {formatAmount(fd.maturityValue)}
                  </span>
                </div>
                {fd.monthsToMaturity != null ? (
                  <div className="ed-ins-col">
                    <span className="ed-ins-col-label">{t("wealthDetail.fd.monthsToMaturity")}</span>
                    <span className="ed-ins-col-val">{fd.monthsToMaturity}</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="ed-ins-story">
            <div className="ed-ins-kicker">{t("wealthDetail.fd.holdOrRedeem")}</div>
            <Verdict
              t={t}
              verdict={fd.holdVerdict}
              reasonKey={fd.holdDetailKey}
              reasonParams={fd.holdDetailParams}
            />
          </div>

          {fd.debtMfNoteKey ? (
            <div className="ed-ins-story" style={{ borderBottom: "none" }}>
              <div className="ed-ins-kicker">{t("wealthDetail.fd.debtMfTitle")}</div>
              <p className="ed-ins-body">{t(fd.debtMfNoteKey)}</p>
              {fd.fdMaturedAmount != null && fd.niftyMaturedAmount != null ? (
                <div className="ed-ins-cols" style={{ marginTop: 10 }}>
                  <div className="ed-ins-col">
                    <span className="ed-ins-col-label">
                      {t("wealthDetail.fd.afterYears", { years: fd.opportunityCostYrs })}
                    </span>
                    <span className="ed-ins-col-val">{formatAmount(fd.fdMaturedAmount)}</span>
                  </div>
                  <div className="ed-ins-col">
                    <span className="ed-ins-col-label">{t("wealthDetail.fd.niftyHistorical")}</span>
                    <span className="ed-ins-col-val" style={{ color: "var(--ed-green)" }}>
                      {formatAmount(fd.niftyMaturedAmount)}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}

      {intel.isVehicle && intel.vehicleEstimate != null ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("wealthDetail.vehicle.depreciation")}</div>
          <div className="ed-ins-cols">
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("wealthDetail.vehicle.marketEstimate")}</span>
              <span className="ed-ins-col-val" style={{ color: "var(--ed-red)" }}>
                {formatAmount(intel.vehicleEstimate)}
              </span>
            </div>
            {intel.gain != null ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("wealthDetail.vehicle.depreciationLabel")}</span>
                <span className="ed-ins-col-val" style={{ color: "var(--ed-red)" }}>
                  {formatAmount(Math.abs(intel.gain))}
                </span>
                {intel.gainPct != null ? (
                  <span className="ed-ins-col-meta">
                    {t("wealthDetail.vehicle.lostPct", { pct: intel.gainPct })}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
          <p className="ed-ins-body" style={{ marginTop: 8 }}>
            {t("wealthDetail.vehicle.depreciationNote")}
          </p>
          <Verdict t={t} verdict="review" reasonKey="wealthDetail.vehicle.reviewReason" />
        </div>
      ) : null}

      {entry.kind === "liability" && (intel.emi > 0 || intel.interestRate > 0) ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("wealthDetail.liability.loanDetails")}</div>
          <div className="ed-ins-cols">
            {intel.emi > 0 ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("wealthDetail.liability.monthlyEmi")}</span>
                <span className="ed-ins-col-val">{formatAmount(intel.emi)}</span>
              </div>
            ) : null}
            {intel.emiBurdenPct != null ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("wealthDetail.liability.pctIncome")}</span>
                <span
                  className="ed-ins-col-val"
                  style={{ color: intel.emiBurdenPct > 40 ? "var(--ed-red)" : "var(--ed-green)" }}
                >
                  {intel.emiBurdenPct}%
                </span>
              </div>
            ) : null}
            {intel.interestRate > 0 ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("netWorth.form.interestRate")}</span>
                <span className="ed-ins-col-val">{intel.interestRate}%</span>
              </div>
            ) : null}
          </div>
          {intel.emiBurdenPct != null ? (
            <Verdict
              t={t}
              verdict={intel.emiBurdenPct > 50 ? "review" : intel.emiBurdenPct > 35 ? "wait" : "hold"}
              reasonKey={
                intel.emiBurdenPct > 50
                  ? "wealthDetail.liability.emiHigh"
                  : intel.emiBurdenPct > 35
                    ? "wealthDetail.liability.emiWatch"
                    : "wealthDetail.liability.emiSafe"
              }
              reasonParams={{ pct: intel.emiBurdenPct }}
            />
          ) : null}
        </div>
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

      {isPhysical ? (
        <div className="ed-ins-story ed-live-market-wrap" style={{ borderBottom: "none" }}>
          {!liveMarketOpen ? (
            <button type="button" className="ed-live-market-trigger" onClick={handleOpenLiveMarket}>
              <span className="ed-live-market-trigger-label">{t("wealthDetail.market.openButton")}</span>
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
                  <button type="button" className="ed-you-save" style={{ marginTop: 8 }} onClick={handleAnalyze}>
                    {t("wealthDetail.estimated.retry")}
                  </button>
                </>
              ) : null}

              {hasLiveMarket && !analyzing ? (
                <>
                  <MarketAnalysis
                    t={t}
                    marketData={analysis.marketData}
                    categoryId={entry.categoryId}
                    insight={analysis.insight}
                    source={analysis.source}
                    formatAmount={formatAmount}
                  />

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
                    onClick={handleAnalyze}
                  >
                    {t("wealthDetail.estimated.refreshAnalysis")}
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
