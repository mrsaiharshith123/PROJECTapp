import Verdict from "./Verdict.jsx";

export default function LiabilityDetailSections({ entry, intel, formatAmount, t }) {
  if (entry.kind !== "liability" || !(intel.emi > 0 || intel.interestRate > 0)) return null;
  return (
    <>
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
    </>
  );
}
