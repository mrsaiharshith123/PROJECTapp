const PROPERTY_IDS = new Set(["property", "property_residential", "property_land", "property_commercial"]);

function aiVerdictPillClass(verdict) {
  if (verdict === "hold" || verdict === "keep" || verdict === "accumulate") return "hold";
  if (verdict === "wait") return "wait";
  if (verdict === "sell" || verdict === "sell_now" || verdict === "review") return "review";
  return "neutral";
}

function trendColor(direction) {
  if (direction === "rising") return "var(--ed-green)";
  if (direction === "declining") return "var(--ed-red)";
  return "var(--ed-ink-faint)";
}

function KickerBadge({ children }) {
  return (
    <span
      style={{
        fontFamily: "'Inter',system-ui,sans-serif",
        fontSize: 9,
        fontWeight: 400,
        color: "var(--ed-ink-faint)",
        textTransform: "none",
        marginLeft: 8,
        letterSpacing: ".02em",
      }}
    >
      {children}
    </span>
  );
}

/**
 * Renders structured Gemini market data as editorial sections.
 * @param {object} props
 */
export default function MarketAnalysis({ t, marketData, categoryId, insight, source, formatAmount }) {
  if (!marketData) {
    return insight ? (
      <div className="ed-ins-story" style={{ borderBottom: "none" }}>
        <div className="ed-ins-kicker">
          {t("wealthDetail.market.title")}
          {source === "ai" ? <KickerBadge>{t("wealthDetail.market.viaGoogle")}</KickerBadge> : null}
        </div>
        <p className="ed-ins-body">{insight}</p>
      </div>
    ) : null;
  }

  const md = marketData;
  const isProperty = PROPERTY_IDS.has(categoryId);
  const isGold = categoryId === "gold";
  const isVehicle = categoryId === "vehicle";

  const confidenceLabel = (level) => {
    if (level === "high") return t("wealthDetail.market.confidenceHigh");
    if (level === "medium") return t("wealthDetail.market.confidenceMedium");
    if (level === "low") return t("wealthDetail.market.confidenceLow");
    return level;
  };

  const directionLabel = (direction) => {
    if (direction === "rising") return t("wealthDetail.market.rising");
    if (direction === "declining") return t("wealthDetail.market.declining");
    return t("wealthDetail.market.flat");
  };

  const holdVerdictLabel = (verdict) => {
    if (verdict === "hold") return t("wealthDetail.verdict.hold");
    if (verdict === "sell") return t("wealthDetail.market.verdictSell");
    if (verdict === "wait") return t("wealthDetail.verdict.wait");
    if (verdict === "accumulate") return t("wealthDetail.market.verdictAccumulate");
    if (verdict === "review") return t("wealthDetail.verdict.review");
    return verdict;
  };

  const sellRecLabel = (rec) => {
    if (rec === "sell_now") return t("wealthDetail.market.sellNow");
    if (rec === "wait") return t("wealthDetail.verdict.wait");
    return t("wealthDetail.market.keep");
  };

  return (
    <>
      {isProperty && md.marketRate ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">
            {t("wealthDetail.market.liveRates")}
            <KickerBadge>
              {md.marketRate.dataSource
                ? t("wealthDetail.market.viaSource", { source: md.marketRate.dataSource })
                : t("wealthDetail.market.viaGoogle")}
              {md.marketRate.confidence
                ? ` · ${confidenceLabel(md.marketRate.confidence)}`
                : ""}
            </KickerBadge>
          </div>
          <div className="ed-ins-cols">
            {(md.marketRate.perSqyd || md.marketRate.perSqft) ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">
                  {t("wealthDetail.market.ratePerUnit", {
                    unit: md.marketRate.perSqyd
                      ? "sqyd"
                      : md.marketRate.unit || "sqft",
                  })}
                </span>
                <span className="ed-ins-col-val" style={{ color: "var(--ed-gold)" }}>
                  ₹
                  {Number(md.marketRate.perSqyd || md.marketRate.perSqft).toLocaleString("en-IN")}
                </span>
                {md.marketRate.rangeMin && md.marketRate.rangeMax ? (
                  <span className="ed-ins-col-meta">
                    ₹{Number(md.marketRate.rangeMin).toLocaleString("en-IN")} –
                    ₹{Number(md.marketRate.rangeMax).toLocaleString("en-IN")}
                  </span>
                ) : null}
              </div>
            ) : null}
            {md.impliedMarketValue ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("wealthDetail.market.impliedValue")}</span>
                <span className="ed-ins-col-val" style={{ color: "var(--ed-green)" }}>
                  {formatAmount(md.impliedMarketValue)}
                </span>
              </div>
            ) : null}
            {md.valuationGap != null ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("wealthDetail.market.vsEstimate")}</span>
                <span
                  className="ed-ins-col-val"
                  style={{ color: md.valuationGap >= 0 ? "var(--ed-green)" : "var(--ed-red)" }}
                >
                  {md.valuationGap >= 0 ? "+" : ""}
                  {formatAmount(md.valuationGap)}
                </span>
                <span className="ed-ins-col-meta">
                  {md.valuationGap >= 0
                    ? t("wealthDetail.market.undervalued")
                    : t("wealthDetail.market.overvalued")}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {isProperty && md.trend ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("wealthDetail.market.priceTrend")}</div>
          <div className="ed-ins-cols">
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("wealthDetail.market.direction")}</span>
              <span className="ed-ins-col-val" style={{ color: trendColor(md.trend.direction) }}>
                {directionLabel(md.trend.direction)}
              </span>
            </div>
            {md.trend.annualGrowthPct != null ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("wealthDetail.market.annualGrowth")}</span>
                <span className="ed-ins-col-val" style={{ color: "var(--ed-green)" }}>
                  ~{md.trend.annualGrowthPct}%
                </span>
              </div>
            ) : null}
          </div>
          {md.trend.description ? (
            <p className="ed-ins-body" style={{ marginTop: 8 }}>
              {md.trend.description}
            </p>
          ) : null}
        </div>
      ) : null}

      {isProperty && md.developments?.length > 0 ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("wealthDetail.market.developments")}</div>
          {md.developments.map((d, i) => (
            <div key={i} className="ed-ins-row" style={{ cursor: "default" }}>
              <div className="ed-ins-row-left">
                <div className="ed-ins-row-name">{d}</div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {isProperty && (md.holdRecommendation || md.bestExitWindow || md.riskFactors?.length > 0) ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("wealthDetail.market.holdSellView")}</div>
          {md.holdRecommendation ? (
            <div className="ed-asset-verdict">
              <span className={`ed-asset-verdict-pill ${aiVerdictPillClass(md.holdRecommendation.verdict)}`}>
                {holdVerdictLabel(md.holdRecommendation.verdict)}
                {md.holdRecommendation.horizon ? ` · ${md.holdRecommendation.horizon}` : ""}
              </span>
              <span className="ed-asset-verdict-reason">{md.holdRecommendation.specificReason}</span>
            </div>
          ) : null}
          {md.bestExitWindow ? (
            <p className="ed-ins-body" style={{ marginTop: 8 }}>
              {t("wealthDetail.market.bestExit", { window: md.bestExitWindow })}
            </p>
          ) : null}
          {md.riskFactors?.length > 0 ? (
            <>
              <div
                style={{
                  marginTop: 10,
                  marginBottom: 4,
                  fontFamily: "'Inter',system-ui,sans-serif",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "var(--ed-ink-faint)",
                }}
              >
                {t("wealthDetail.market.riskFactors")}
              </div>
              {md.riskFactors.map((r, i) => (
                <div key={i} className="ed-ins-row" style={{ cursor: "default" }}>
                  <div className="ed-ins-row-left">
                    <div className="ed-ins-row-name" style={{ color: "var(--ed-red)", fontSize: 13 }}>
                      {r}
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : null}
        </div>
      ) : null}

      {isGold && md.currentRatePerGram ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">
            {t("wealthDetail.market.goldRate")}
            <KickerBadge>{md.currentRatePerGram.dataSource || t("wealthDetail.market.viaGoogle")}</KickerBadge>
          </div>
          <div className="ed-ins-cols">
            {md.currentRatePerGram["22K"] ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("wealthDetail.market.gold22k")}</span>
                <span className="ed-ins-col-val" style={{ color: "var(--ed-gold)" }}>
                  ₹{Number(md.currentRatePerGram["22K"]).toLocaleString("en-IN")}
                </span>
              </div>
            ) : null}
            {md.currentRatePerGram["24K"] ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("wealthDetail.market.gold24k")}</span>
                <span className="ed-ins-col-val" style={{ color: "var(--ed-gold)" }}>
                  ₹{Number(md.currentRatePerGram["24K"]).toLocaleString("en-IN")}
                </span>
              </div>
            ) : null}
            {md.impliedCurrentValue ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("wealthDetail.market.goldWorth")}</span>
                <span className="ed-ins-col-val" style={{ color: "var(--ed-green)" }}>
                  {formatAmount(md.impliedCurrentValue)}
                </span>
              </div>
            ) : null}
          </div>
          {md.trend?.description ? (
            <p className="ed-ins-body" style={{ marginTop: 8 }}>
              {md.trend.description}
            </p>
          ) : null}
        </div>
      ) : null}

      {isGold && md.marketOutlook ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("wealthDetail.market.goldOutlook")}</div>
          <div className="ed-ins-row" style={{ cursor: "default" }}>
            <div className="ed-ins-row-left">
              <div className="ed-ins-row-cat">{t("wealthDetail.market.shortTerm")}</div>
              <div className="ed-ins-row-name">{md.marketOutlook.shortTerm}</div>
            </div>
          </div>
          <div className="ed-ins-row" style={{ cursor: "default", borderBottom: "none" }}>
            <div className="ed-ins-row-left">
              <div className="ed-ins-row-cat">{t("wealthDetail.market.longTerm")}</div>
              <div className="ed-ins-row-name">{md.marketOutlook.longTerm}</div>
            </div>
          </div>
          {md.holdRecommendation ? (
            <div className="ed-asset-verdict" style={{ marginTop: 10 }}>
              <span className={`ed-asset-verdict-pill ${aiVerdictPillClass(md.holdRecommendation.verdict)}`}>
                {holdVerdictLabel(md.holdRecommendation.verdict)}
              </span>
              <span className="ed-asset-verdict-reason">{md.holdRecommendation.reason}</span>
            </div>
          ) : null}
          {md.sgbAdvantage ? (
            <p className="ed-ins-body" style={{ marginTop: 8 }}>
              {md.sgbAdvantage}
            </p>
          ) : null}
        </div>
      ) : null}

      {isVehicle && md.estimatedResaleValue ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">
            {t("wealthDetail.market.vehicleResale")}
            <KickerBadge>
              {md.estimatedResaleValue.dataSource
                ? t("wealthDetail.market.viaSource", { source: md.estimatedResaleValue.dataSource })
                : t("wealthDetail.market.viaGoogle")}
              {md.estimatedResaleValue.confidence
                ? ` · ${confidenceLabel(md.estimatedResaleValue.confidence)}`
                : ""}
            </KickerBadge>
          </div>
          <div className="ed-ins-cols">
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("wealthDetail.market.conservative")}</span>
              <span className="ed-ins-col-val">{formatAmount(md.estimatedResaleValue.low)}</span>
            </div>
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("wealthDetail.market.mostLikely")}</span>
              <span className="ed-ins-col-val" style={{ color: "var(--ed-gold)" }}>
                {formatAmount(md.estimatedResaleValue.mid)}
              </span>
            </div>
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("wealthDetail.market.bestCase")}</span>
              <span className="ed-ins-col-val">{formatAmount(md.estimatedResaleValue.high)}</span>
            </div>
          </div>
          {md.marketDemand ? (
            <p className="ed-ins-body" style={{ marginTop: 8 }}>
              {t("wealthDetail.market.demand", { demand: md.marketDemand })}
            </p>
          ) : null}
          {md.topBuyingPlatforms?.length > 0 ? (
            <p className="ed-ins-body">
              {t("wealthDetail.market.platforms", { platforms: md.topBuyingPlatforms.join(", ") })}
            </p>
          ) : null}
          {md.sellNowOrWait ? (
            <div className="ed-asset-verdict" style={{ marginTop: 10 }}>
              <span
                className={`ed-asset-verdict-pill ${aiVerdictPillClass(md.sellNowOrWait.recommendation)}`}
              >
                {sellRecLabel(md.sellNowOrWait.recommendation)}
              </span>
              <span className="ed-asset-verdict-reason">{md.sellNowOrWait.reason}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {md.summary ? (
        <div className="ed-ins-story" style={{ borderBottom: "none" }}>
          <div className="ed-ins-kicker">{t("wealthDetail.market.overall")}</div>
          <p className="ed-ins-body">{md.summary}</p>
          <p
            className="ed-ins-body"
            style={{ marginTop: 8, fontSize: 11, color: "var(--ed-ink-faint)", fontStyle: "normal" }}
          >
            {t("wealthDetail.market.disclaimer")}
          </p>
        </div>
      ) : null}
    </>
  );
}
