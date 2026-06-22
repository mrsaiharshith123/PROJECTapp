import { useMemo, useState } from "react";
import {
  simulatePrepayment,
  buildCumulativePaidSeries,
  payoffLabelFromMonths,
  sampleLoanChartRows,
  estimateLoanPayoffStressDelta,
} from "../../../engines/prepayment.js";
import { totalMonthlyBurden } from "../../../engines/burden.js";
import { comparePayoffStrategies } from "../../../engines/payoffOptimizer.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { formatInr, INR, ARROW, EM_DASH } from "../../../constants/symbols.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { SegmentedControl } from "../../patterns/SegmentedControl.jsx";
import { ProGate } from "../../patterns/ProGate.jsx";
import { Caption, Body } from "../../primitives/Text.jsx";
import { inputClassName } from "../../primitives/Input.jsx";
import { ToolComparisonChart } from "../../patterns/ToolComparisonChart.jsx";
import { ToolAnswerHero } from "../../patterns/ToolAnswerHero.jsx";
import LoanPayoffAdvisor from "./LoanPayoffAdvisor.jsx";

const fieldClass = `${inputClassName()} ct-input-tint`;

function DebtOrderPanel() {
  const { t } = useTranslation();
  const { commitments, getEffectiveStatus } = usePerovo();
  const [payoffExtra, setPayoffExtra] = useState("");
  const payoff = useMemo(() => {
    const x = Number(payoffExtra) || 0;
    return comparePayoffStrategies(commitments, getEffectiveStatus, x);
  }, [commitments, getEffectiveStatus, payoffExtra]);

  return (
    <div className="ct-stack">
      <Caption>{t("tools.planner.debtIntro")}</Caption>
      <div>
        <label className="ct-field-label">{t("tools.planner.extraDebt", { currency: INR })}</label>
        <input
          className={fieldClass}
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
            <div className="ct-stat-tile teal">
              <p className="ct-stat-tile-label">{payoff.recommendation.label}</p>
              {payoff.recommendation.firstPay && (
                <p className="ct-stat-tile-value text-sm">
                  {t("tools.planner.startWith", {
                    name: payoff.recommendation.firstPay.name,
                    reason: payoff.recommendation.reason,
                  })}
                </p>
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
  } = usePerovo();
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

  const paidSeries = useMemo(() => {
    const P = Number(principal) || 0;
    const r = Number(rate) || 0;
    const e = Number(emi) || 0;
    const x = Number(extra) || 0;
    if (P <= 0 || e <= 0) return null;
    return buildCumulativePaidSeries({
      principalOutstanding: P,
      annualRatePercent: r,
      scheduledEmi: e,
      extraMonthly: x,
    });
  }, [principal, rate, emi, extra]);

  const stressDelta = useMemo(() => {
    const e = Number(emi) || 0;
    const x = Number(extra) || 0;
    const income = Number(settings?.monthlyIncome) || 0;
    if (income <= 0 || e <= 0) return null;
    const burden = totalMonthlyBurden(commitments, getEffectiveStatus);
    return estimateLoanPayoffStressDelta({
      monthlyIncome: income,
      monthlyBurdenExcludingThisEmi: Math.max(0, burden - e),
      emi: e,
      extraMonthly: x,
    });
  }, [emi, extra, settings?.monthlyIncome, commitments, getEffectiveStatus]);

  return (
    <div className="ct-stack">
      <SegmentedControl options={tabs} value={tab} onChange={setTab} />
      {tab === "extra" && (
        <>
          {sim ? (
            <ToolAnswerHero
              tone="sim"
              label={t("tools.loan.monthsSaved")}
              value={String(sim.monthsSaved)}
              subtitle={t("tools.loan.interestSaved", { amount: formatInr(Math.round(sim.interestSaved)) })}
            />
          ) : null}
          <Caption>{t("tools.loan.extraIntro")}</Caption>
          <div className="ct-grid-2">
            <div>
              <label className="ct-field-label">{t("tools.loan.loanLeft", { currency: INR })}</label>
              <input className={fieldClass} value={principal} onChange={(e) => setPrincipal(e.target.value)} inputMode="numeric" />
            </div>
            <div>
              <label className="ct-field-label">{t("tools.loan.interestRate")}</label>
              <input className={fieldClass} value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
            </div>
            <div>
              <label className="ct-field-label">{t("tools.loan.yourEmi", { currency: INR })}</label>
              <input className={fieldClass} value={emi} onChange={(e) => setEmi(e.target.value)} inputMode="numeric" />
            </div>
            <div>
              <label className="ct-field-label">{t("tools.loan.extraPerMonth", { currency: INR })}</label>
              <input className={fieldClass} value={extra} onChange={(e) => setExtra(e.target.value)} inputMode="numeric" />
            </div>
          </div>
          {sim && (
            <>
              <div className="ct-grid-2">
                <div className="ct-stat-tile indigo">
                  <p className="ct-stat-tile-value text-sm">
                    {sim.baselineMonths} {ARROW} {sim.acceleratedMonths}
                  </p>
                </div>
                {stressDelta && (
                  <div className="ct-stat-tile amber">
                    <p className="ct-stat-tile-value text-sm">
                      {t("charts.stressAfterPayoff", {
                        before: stressDelta.during,
                        after: stressDelta.after,
                        delta: stressDelta.delta,
                      })}
                    </p>
                  </div>
                )}
              </div>
              {Number(extra) > 0 && (
                <div className="ct-stat-tile">
                  <p className="ct-stat-tile-value text-sm opacity-80">{t("charts.stressDuringExtra")}</p>
                </div>
              )}
              {paidSeries && (
                <div className="ct-grid-2">
                  <div className="ct-stat-tile teal">
                    <p className="ct-stat-tile-value text-sm">
                      {t("charts.loanPayoffBaseline", {
                        month: payoffLabelFromMonths(paidSeries.baselineMonths, todayStr),
                        total: formatInr(paidSeries.baselineTotalPaid),
                      })}
                    </p>
                  </div>
                  {Number(extra) > 0 && (
                    <div className="ct-stat-tile indigo">
                      <p className="ct-stat-tile-value text-sm">
                        {t("charts.loanPayoffWithExtra", {
                          month: payoffLabelFromMonths(paidSeries.acceleratedMonths, todayStr),
                          total: formatInr(paidSeries.acceleratedTotalPaid),
                        })}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {paidSeries && paidSeries.rows.length > 0 && (
              <ToolComparisonChart
                data={sampleLoanChartRows(paidSeries.rows)}
                titleKey="charts.loanPaidTitle"
                baselineLabelKey="tools.loan.seriesPaidBaseline"
                whatIfLabelKey="tools.loan.seriesPaidExtra"
              />
              )}
            </>
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
      {tab === "order" && (
        <ProGate featureId="payoff_optimizer">
          <DebtOrderPanel />
        </ProGate>
      )}
    </div>
  );
}
