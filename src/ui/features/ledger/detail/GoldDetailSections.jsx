import Verdict from "./Verdict.jsx";

export default function GoldDetailSections({ entry: _entry, intel, formatAmount, t }) {
  const gold = intel.goldIntel;
  if (!gold) return null;
  return (
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
  );
}
