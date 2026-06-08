import { useMemo, useState } from "react";
import { simulatePrepayment } from "../../../engines/prepayment.js";
import { comparePayoffStrategies } from "../../../engines/payoffOptimizer.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { formatInr, INR, ARROW, EM_DASH } from "../../../constants/symbols.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { SegmentedControl } from "../../patterns/SegmentedControl.jsx";
import { Caption, Body } from "../../primitives/Text.jsx";
import LoanPayoffAdvisor from "./LoanPayoffAdvisor.jsx";

function DebtOrderPanel() {
  const { t } = useTranslation();
  const { commitments, getEffectiveStatus } = useCommitTrack();
  const [payoffExtra, setPayoffExtra] = useState("");
  const payoff = useMemo(() => {
    const x = Number(payoffExtra) || 0;
    return comparePayoffStrategies(commitments, getEffectiveStatus, x);
  }, [commitments, getEffectiveStatus, payoffExtra]);

  return (
    <div className="ct-stack">
      <Caption>{t("tools.planner.debtIntro")}</Caption>
      <div>
        <label className="ct-metric-label block">{t("tools.planner.extraDebt", { currency: INR })}</label>
        <input
          className="ct-input mt-1"
          value={payoffExtra}
          onChange={(e) => setPayoffExtra(e.target.value)}
          placeholder="0"
          inputMode="numeric"
        />
      </div>
      {payoff.debts.length === 0 ? (
        <Caption>{t("tools.planner.noDebts")}</Caption>
      ) : (
        <div className="ct-stack-sm">
          {payoff.recommendation && (
            <div className="ct-insight-accent">
              <Body className="!text-sm font-semibold">{payoff.recommendation.label}</Body>
              {payoff.recommendation.firstPay && (
                <Caption className="block">
                  {t("tools.planner.startWith", {
                    name: payoff.recommendation.firstPay.name,
                    reason: payoff.recommendation.reason,
                  })}
                </Caption>
              )}
            </div>
          )}
          <div>
            <Caption className="font-semibold block">{t("tools.planner.snowball")}</Caption>
            <ol className="list-decimal list-inside ct-stack-sm">
              {payoff.snowball.map((d) => (
                <li key={d.id}>
                  {d.name} {EM_DASH} {formatInr(d.balance)} {EM_DASH} {d.interestRate}%
                </li>
              ))}
            </ol>
          </div>
          <div>
            <Caption className="font-semibold block">{t("tools.planner.avalanche")}</Caption>
            <ol className="list-decimal list-inside ct-stack-sm">
              {payoff.avalanche.map((d) => (
                <li key={d.id}>
                  {d.name} {EM_DASH} {formatInr(d.balance)} {EM_DASH} {d.interestRate}%
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoanToolsPanel() {
  const { t } = useTranslation();
  const {
    commitments,
    lendings,
    settings,
    getEffectiveStatus,
    getEffectiveLendingStatus,
    todayStr,
  } = useCommitTrack();
  const tabs = useMemo(
    () => [
      { id: "extra", label: t("tools.loan.tabExtra") },
      { id: "timing", label: t("tools.loan.tabTiming") },
      { id: "order", label: t("tools.loan.tabOrder") },
    ],
    [t],
  );
  const [tab, setTab] = useState("extra");
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("10.5");
  const [emi, setEmi] = useState("");
  const [extra, setExtra] = useState("");

  const sim = useMemo(() => {
    const P = Number(principal) || 0;
    const r = Number(rate) || 0;
    const e = Number(emi) || 0;
    const x = Number(extra) || 0;
    if (P <= 0 || e <= 0) return null;
    return simulatePrepayment({
      principalOutstanding: P,
      annualRatePercent: r,
      scheduledEmi: e,
      extraMonthly: x,
    });
  }, [principal, rate, emi, extra]);

  return (
    <div className="ct-stack">
      <SegmentedControl options={tabs} value={tab} onChange={setTab} />
      {tab === "extra" && (
        <>
          <Caption>{t("tools.loan.extraIntro")}</Caption>
          <div className="ct-grid-2">
            <div>
              <label className="ct-metric-label block">{t("tools.loan.loanLeft", { currency: INR })}</label>
              <input className="ct-input mt-1" value={principal} onChange={(e) => setPrincipal(e.target.value)} inputMode="numeric" />
            </div>
            <div>
              <label className="ct-metric-label block">{t("tools.loan.interestRate")}</label>
              <input className="ct-input mt-1" value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
            </div>
            <div>
              <label className="ct-metric-label block">{t("tools.loan.yourEmi", { currency: INR })}</label>
              <input className="ct-input mt-1" value={emi} onChange={(e) => setEmi(e.target.value)} inputMode="numeric" />
            </div>
            <div>
              <label className="ct-metric-label block">{t("tools.loan.extraPerMonth", { currency: INR })}</label>
              <input className="ct-input mt-1" value={extra} onChange={(e) => setExtra(e.target.value)} inputMode="numeric" />
            </div>
          </div>
          {sim && (
            <div className="ct-insight-accent ct-stack-sm">
              <Body className="!text-sm">
                <span className="font-semibold">{t("tools.loan.monthsSaved")}</span> {sim.monthsSaved} ({sim.baselineMonths}{" "}
                {ARROW} {sim.acceleratedMonths})
              </Body>
              <Caption>{t("tools.loan.interestSaved", { amount: formatInr(Math.round(sim.interestSaved)) })}</Caption>
            </div>
          )}
        </>
      )}
      {tab === "timing" && (
        <LoanPayoffAdvisor
          commitments={commitments}
          lendings={lendings}
          settings={settings}
          getEffectiveStatus={getEffectiveStatus}
          getEffectiveLendingStatus={getEffectiveLendingStatus}
          todayStr={todayStr}
        />
      )}
      {tab === "order" && <DebtOrderPanel />}
    </div>
  );
}
