import Verdict from "./Verdict.jsx";

export default function CryptoDetailSections({ entry: _entry, intel, formatAmount, t }) {
  const crypto = intel.cryptoIntel;
  if (!crypto) return null;

  return (
    <>
      <div className="ed-ins-story">
        <div className="ed-ins-kicker">{t("wealthDetail.crypto.performance")}</div>
        <div className="ed-ins-cols">
          {crypto.gain != null ? (
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("wealthDetail.crypto.totalGain")}</span>
              <span
                className="ed-ins-col-val"
                style={{ color: crypto.gain >= 0 ? "var(--ed-green)" : "var(--ed-red)" }}
              >
                {formatAmount(crypto.gain)}
                {crypto.gainPct != null ? ` (${crypto.gainPct >= 0 ? "+" : ""}${crypto.gainPct}%)` : ""}
              </span>
            </div>
          ) : null}
          {crypto.cagr != null ? (
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("wealthDetail.crypto.cagr")}</span>
              <span className="ed-ins-col-val">{crypto.cagr}%</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="ed-ins-story">
        <div className="ed-ins-kicker">{t("wealthDetail.crypto.taxIfSold")}</div>
        <div className="ed-tax-row">
          <span className="ed-tax-label">{t("wealthDetail.crypto.tax30pct")}</span>
          <span className="ed-tax-val" style={{ color: "var(--ed-red)" }}>
            −{formatAmount(crypto.taxIfSold)}
          </span>
        </div>
        <div className="ed-tax-row" style={{ borderBottom: "none" }}>
          <span className="ed-tax-label">{t("wealthDetail.crypto.netAfterTax")}</span>
          <span className="ed-tax-val" style={{ color: "var(--ed-green)", fontSize: 18 }}>
            {formatAmount(crypto.netProceeds)}
          </span>
        </div>
        {crypto.tdsApplicable ? (
          <p className="ed-ins-body" style={{ marginTop: 8 }}>
            {t("wealthDetail.crypto.tdsNote", { amount: formatAmount(crypto.tdsAmount) })}
          </p>
        ) : null}
      </div>

      <div className="ed-ins-story">
        <div className="ed-ins-kicker">{t("wealthDetail.crypto.riskTitle")}</div>
        <p className="ed-ins-body">{t(crypto.riskNoteKey)}</p>
        <p className="ed-ins-body">{t(crypto.lossOffsetNoteKey)}</p>
      </div>

      <div className="ed-ins-story" style={{ borderBottom: "none" }}>
        <div className="ed-ins-kicker">{t("wealthDetail.crypto.holdTitle")}</div>
        <Verdict t={t} verdict={crypto.holdVerdict} reasonKey={crypto.holdDetailKey} />
        <p className="ed-ins-body" style={{ marginTop: 8 }}>{t(crypto.taxNoteKey)}</p>
      </div>
    </>
  );
}
