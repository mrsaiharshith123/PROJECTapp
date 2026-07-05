export default function EpfDetailSections({ entry: _entry, intel, formatAmount, t }) {
  const epf = intel.epfIntel;
  if (!epf) return null;

  const realReturn = Math.round((epf.growthRatePercent - 6) * 10) / 10;

  return (
    <>
      <div className="ed-ins-story">
        <div className="ed-ins-kicker">{t("wealthDetail.epf.title")}</div>
        <div className="ed-ins-cols">
          <div className="ed-ins-col">
            <span className="ed-ins-col-label">{t("wealthDetail.epf.currentBalance")}</span>
            <span className="ed-ins-col-val">{formatAmount(epf.currentCorpus)}</span>
          </div>
          <div className="ed-ins-col">
            <span className="ed-ins-col-label">{t("wealthDetail.epf.projectedAt60")}</span>
            <span className="ed-ins-col-val" style={{ color: "var(--ed-green)" }}>
              {formatAmount(epf.projectedCorpusAtRetirement)}
            </span>
            <span className="ed-ins-col-meta">
              {t("wealthDetail.epf.yearsLeft", { years: epf.yearsToRetirement })}
            </span>
          </div>
          <div className="ed-ins-col">
            <span className="ed-ins-col-label">{t("wealthDetail.epf.monthlyContribution")}</span>
            <span className="ed-ins-col-val">{formatAmount(epf.monthlyTotal)}</span>
            <span className="ed-ins-col-meta">
              {t("wealthDetail.epf.employerShare", { amount: formatAmount(epf.monthlyEmployer) })}
            </span>
          </div>
          <div className="ed-ins-col">
            <span className="ed-ins-col-label">{t("wealthDetail.property.realReturn")}</span>
            <span className="ed-ins-col-val" style={{ color: realReturn >= 0 ? "var(--ed-green)" : "var(--ed-red)" }}>
              {realReturn >= 0 ? "+" : ""}
              {realReturn}%
            </span>
            <span className="ed-ins-col-meta">
              {t("wealthDetail.epf.rateMeta", { rate: epf.growthRatePercent })}
            </span>
          </div>
        </div>
      </div>

      <div className="ed-ins-story" style={{ borderBottom: "none" }}>
        <div className="ed-ins-kicker">{t("wealthDetail.epf.taxTitle")}</div>
        <p className="ed-ins-body">{t("wealthDetail.epf.taxNote")}</p>
        <p className="ed-ins-body">{t("wealthDetail.epf.withdrawalNote")}</p>
      </div>
    </>
  );
}
