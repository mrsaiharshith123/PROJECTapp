import Verdict from "./Verdict.jsx";

export default function StockDetailSections({ entry: _entry, intel, formatAmount, t }) {
  const stock = intel.stockIntel;
  if (!stock) return null;

  const allActions = [
    ...stock.splits.map((a) => ({ ...a, type: "split" })),
    ...stock.bonuses.map((a) => ({ ...a, type: "bonus" })),
    ...stock.dividends.map((a) => ({ ...a, type: "dividend" })),
  ].sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));

  return (
    <>
      <div className="ed-ins-story">
        <div className="ed-ins-kicker">{t("wealthDetail.stock.holdingTitle")}</div>
        <div className="ed-ins-cols">
          {stock.ticker ? (
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("wealthDetail.stock.ticker")}</span>
              <span className="ed-ins-col-val">
                {stock.ticker} · {stock.exchange}
              </span>
            </div>
          ) : null}
          {stock.quantity > 0 ? (
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("wealthDetail.stock.quantity")}</span>
              <span className="ed-ins-col-val">{stock.quantity}</span>
            </div>
          ) : null}
          {stock.buyPrice > 0 ? (
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("wealthDetail.stock.avgBuy")}</span>
              <span className="ed-ins-col-val">{formatAmount(stock.buyPrice)}</span>
            </div>
          ) : null}
          {stock.livePrice > 0 ? (
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("wealthDetail.stock.currentPrice")}</span>
              <span className="ed-ins-col-val">{formatAmount(stock.livePrice)}</span>
            </div>
          ) : null}
          {stock.totalGain != null ? (
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("wealthDetail.stock.totalGain")}</span>
              <span
                className="ed-ins-col-val"
                style={{ color: stock.totalGain >= 0 ? "var(--ed-green)" : "var(--ed-red)" }}
              >
                {formatAmount(stock.totalGain)}
                {stock.gainPct != null ? ` (${stock.gainPct >= 0 ? "+" : ""}${stock.gainPct}%)` : ""}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {stock.cagr != null ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("wealthDetail.stock.cagrTitle")}</div>
          <div className="ed-ins-cols">
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("wealthDetail.stock.yourCagr")}</span>
              <span
                className="ed-ins-col-val"
                style={{ color: stock.cagr >= stock.benchmarkCagr ? "var(--ed-green)" : "var(--ed-gold)" }}
              >
                {stock.cagr}%
              </span>
              {stock.vsBenchmark != null ? (
                <span className="ed-ins-col-meta">
                  {t("wealthDetail.stock.vsNifty", { pct: stock.vsBenchmark })}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {allActions.length > 0 ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("wealthDetail.stock.corporateActions")}</div>
          {allActions.map((action, i) => (
            <div key={`${action.type}-${action.date}-${i}`} className="ed-projection-row">
              <span className="ed-projection-label">{action.date || "—"}</span>
              <span className="ed-projection-val">{t(`wealthDetail.stock.action.${action.type}`)}</span>
              <span className="ed-projection-label" style={{ fontSize: 10 }}>
                {action.ratio || (action.amount != null ? formatAmount(action.amount) : "—")}
              </span>
            </div>
          ))}
          {stock.totalDividendReceived > 0 ? (
            <p className="ed-ins-body" style={{ marginTop: 8 }}>
              {t("wealthDetail.stock.dividendsTotal", { amount: formatAmount(stock.totalDividendReceived) })}
            </p>
          ) : null}
        </div>
      ) : null}

      {stock.taxIfSold != null ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("wealthDetail.stock.taxIfSold")}</div>
          <div className="ed-tax-row">
            <span className="ed-tax-label">
              {stock.isLongTerm ? t("wealthDetail.stock.ltcgLabel") : t("wealthDetail.stock.stcgLabel")}
            </span>
            <span className="ed-tax-val" style={{ color: "var(--ed-red)" }}>
              −{formatAmount(stock.taxIfSold)}
            </span>
          </div>
          <div className="ed-tax-row" style={{ borderBottom: "none" }}>
            <span className="ed-tax-label">{t("wealthDetail.stock.netAfterTax")}</span>
            <span className="ed-tax-val" style={{ color: "var(--ed-green)", fontSize: 18 }}>
              {formatAmount(stock.netProceeds)}
            </span>
          </div>
        </div>
      ) : null}

      {stock.projections?.length > 0 ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("wealthDetail.stock.projectionTitle")}</div>
          {stock.projections.map((p) => (
            <div key={p.years} className="ed-projection-row">
              <span className="ed-projection-label">
                {t("wealthDetail.stock.projectionYears", { years: p.years })}
              </span>
              <span className="ed-projection-val">
                {p.atCurrentCagr != null ? formatAmount(p.atCurrentCagr) : "—"}
              </span>
              <span className="ed-projection-label" style={{ fontSize: 10 }}>
                {t("wealthDetail.stock.atNifty", { amount: formatAmount(p.atBenchmark) })}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="ed-ins-story" style={{ borderBottom: "none" }}>
        <div className="ed-ins-kicker">{t("wealthDetail.stock.holdOrSell")}</div>
        <Verdict t={t} verdict={stock.holdVerdict} reasonKey={stock.holdDetailKey} />
      </div>
    </>
  );
}
