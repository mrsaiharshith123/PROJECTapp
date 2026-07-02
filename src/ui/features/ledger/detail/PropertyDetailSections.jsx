import { useState } from "react";
import { LocationMapPicker } from "../../../patterns/LocationMapPicker.jsx";
import { CtIcon } from "../../../icons/CtIcon.jsx";
import Verdict from "./Verdict.jsx";

export default function PropertyDetailSections({ entry, intel, formatAmount, t, tierLabel, onEditPin }) {
  const prop = intel.propertyIntel;
  const [showMap, setShowMap] = useState(false);
  if (!prop) return null;
  return (
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
                  <LocationMapPicker
                  latitude={prop.latitude}
                  longitude={prop.longitude}
                  readOnly
                  onChange={() => {}}
                  style={{ height: 200, borderRadius: 10, marginTop: 10 }}
                />
                ) : null}
              </>
            ) : (
              <button type="button" className="ed-map-btn" onClick={() => onEditPin()}>
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
  );
}
