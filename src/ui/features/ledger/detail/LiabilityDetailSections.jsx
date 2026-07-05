import Verdict from "./Verdict.jsx";

export default function LiabilityDetailSections({ entry, intel, formatAmount, t }) {
  if (entry.kind !== "liability") return null;

  const loan = intel.loanIntel;
  if (!loan && !(intel.emi > 0 || intel.interestRate > 0)) return null;

  if (loan) {
    return (
      <>
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("wealthDetail.loan.title")}</div>
          <div className="ed-ins-cols">
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("wealthDetail.loan.outstanding")}</span>
              <span className="ed-ins-col-val">{formatAmount(loan.outstanding)}</span>
            </div>
            {loan.monthlyInterest != null ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("wealthDetail.loan.monthlyInterest")}</span>
                <span className="ed-ins-col-val">{formatAmount(loan.monthlyInterest)}</span>
              </div>
            ) : null}
            {loan.emi > 0 ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("wealthDetail.liability.monthlyEmi")}</span>
                <span className="ed-ins-col-val">{formatAmount(loan.emi)}</span>
              </div>
            ) : null}
            {loan.emiBurdenPct != null ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("wealthDetail.loan.emiBurden")}</span>
                <span
                  className="ed-ins-col-val"
                  style={{ color: loan.emiBurdenPct > 50 ? "var(--ed-red)" : "var(--ed-green)" }}
                >
                  {loan.emiBurdenPct}%
                </span>
                <span className="ed-ins-col-meta">
                  {t("wealthDetail.loan.rbiGuideline", { pct: loan.rbiLimit })}
                </span>
              </div>
            ) : null}
            {loan.monthsLeft != null ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("wealthDetail.loan.monthsLeft")}</span>
                <span className="ed-ins-col-val">{loan.monthsLeft}</span>
              </div>
            ) : null}
            {loan.totalInterestLeft != null ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("wealthDetail.loan.interestLeft")}</span>
                <span className="ed-ins-col-val" style={{ color: "var(--ed-red)" }}>
                  {formatAmount(loan.totalInterestLeft)}
                </span>
              </div>
            ) : null}
          </div>
          {loan.repaidPct != null ? (
            <p className="ed-ins-body" style={{ marginTop: 8 }}>
              {t("wealthDetail.loan.repaidProgress", {
                pct: loan.repaidPct,
                amount: formatAmount(loan.repaidAmount),
              })}
            </p>
          ) : null}
          {loan.prepayBenefit != null ? (
            <p className="ed-ins-body" style={{ marginTop: 8 }}>
              {t("wealthDetail.loan.prepayBenefit", { amount: formatAmount(loan.prepayBenefit) })}
            </p>
          ) : null}
          {loan.burdenVerdictKey ? (
            <Verdict
              t={t}
              verdict={
                loan.emiBurdenPct != null && loan.emiBurdenPct > loan.rbiLimit
                  ? "review"
                  : loan.emiBurdenPct != null && loan.emiBurdenPct > 35
                    ? "wait"
                    : "hold"
              }
              reasonKey={loan.burdenVerdictKey}
              reasonParams={{ pct: loan.emiBurdenPct }}
            />
          ) : null}
        </div>
      </>
    );
  }

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
