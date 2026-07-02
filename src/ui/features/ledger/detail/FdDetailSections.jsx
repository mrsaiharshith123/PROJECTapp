import Verdict from "./Verdict.jsx";

export default function FdDetailSections({ entry, intel, formatAmount, t }) {
  const fd = intel.fdIntel;
  if (!fd) return null;
  return (
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
  );
}
