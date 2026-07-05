import Verdict from "./Verdict.jsx";

export default function MutualFundDetailSections({ entry: _entry, intel, formatAmount, t }) {
  const mf = intel.mfIntel;
  if (!mf) return null;

  return (
    <>
      <div className="ed-ins-story">
        <div className="ed-ins-kicker">{t("wealthDetail.mf.title")}</div>
        <div className="ed-ins-cols">
          <div className="ed-ins-col">
            <span className="ed-ins-col-label">{t("wealthDetail.mf.fundType")}</span>
            <span className="ed-ins-col-val">{t(`wealthDetail.mf.type.${mf.fundType}`)}</span>
          </div>
          {mf.absoluteReturn != null ? (
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("wealthDetail.mf.absoluteReturn")}</span>
              <span
                className="ed-ins-col-val"
                style={{ color: mf.absoluteReturn >= 0 ? "var(--ed-green)" : "var(--ed-red)" }}
              >
                {mf.absoluteReturn >= 0 ? "+" : ""}
                {mf.absoluteReturn}%
              </span>
            </div>
          ) : null}
          {mf.cagr != null ? (
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("wealthDetail.mf.cagr")}</span>
              <span className="ed-ins-col-val">{mf.cagr}%</span>
              {mf.vsBenchmark != null ? (
                <span className="ed-ins-col-meta">
                  {t("wealthDetail.mf.vsNifty", { pct: mf.vsBenchmark })}
                </span>
              ) : null}
            </div>
          ) : null}
          {mf.realReturn != null ? (
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("wealthDetail.property.realReturn")}</span>
              <span
                className="ed-ins-col-val"
                style={{ color: mf.realReturn >= 0 ? "var(--ed-green)" : "var(--ed-red)" }}
              >
                {mf.realReturn >= 0 ? "+" : ""}
                {mf.realReturn}%
              </span>
            </div>
          ) : null}
          {mf.monthlySip > 0 ? (
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("wealthDetail.mf.monthlySip")}</span>
              <span className="ed-ins-col-val">{formatAmount(mf.monthlySip)}</span>
              {mf.sipBurdenPct != null ? (
                <span className="ed-ins-col-meta">
                  {t("wealthDetail.mf.sipBurden", { pct: mf.sipBurdenPct })}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        {mf.elssLockRemaining != null && mf.elssLockRemaining > 0 ? (
          <p className="ed-ins-body" style={{ marginTop: 8 }}>
            {t("wealthDetail.mf.elssLock", { years: mf.elssLockRemaining.toFixed(1) })}
          </p>
        ) : null}
      </div>

      {mf.taxIfRedeemed != null ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("wealthDetail.mf.taxIfRedeemed")}</div>
          <div className="ed-tax-row">
            <span className="ed-tax-label">
              {mf.isLongTerm ? t("wealthDetail.mf.ltcgLabel") : t("wealthDetail.mf.stcgLabel")}
            </span>
            <span className="ed-tax-val" style={{ color: "var(--ed-red)" }}>
              −{formatAmount(mf.taxIfRedeemed)}
            </span>
          </div>
          <div className="ed-tax-row" style={{ borderBottom: "none" }}>
            <span className="ed-tax-label">{t("wealthDetail.mf.netAfterTax")}</span>
            <span className="ed-tax-val" style={{ color: "var(--ed-green)", fontSize: 18 }}>
              {formatAmount(mf.netProceeds)}
            </span>
          </div>
        </div>
      ) : null}

      {mf.projections?.length > 0 ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("wealthDetail.mf.projectionTitle")}</div>
          {mf.projections.map((p) => (
            <div key={p.years} className="ed-projection-row">
              <span className="ed-projection-label">
                {t("wealthDetail.mf.projectionYears", { years: p.years })}
              </span>
              <span className="ed-projection-val">
                {p.atCurrentCagr != null ? formatAmount(p.atCurrentCagr) : "—"}
              </span>
              <span className="ed-projection-label" style={{ fontSize: 10 }}>
                {t("wealthDetail.mf.atNifty", { amount: formatAmount(p.atBenchmark) })}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="ed-ins-story" style={{ borderBottom: "none" }}>
        <div className="ed-ins-kicker">{t("wealthDetail.mf.holdOrRedeem")}</div>
        <Verdict t={t} verdict={mf.holdVerdict} reasonKey={mf.holdDetailKey} />
      </div>
    </>
  );
}
