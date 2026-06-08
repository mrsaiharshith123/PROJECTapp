import { useMemo, useState } from "react";
import { formatInr, INR, EM_DASH } from "../../../constants/symbols.js";
import { buildQuickScenarioSummaries } from "../../../engines/quickScenarios.js";
import { comparePayoffStrategies } from "../../../engines/payoffOptimizer.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { getExperienceMode } from "../../../constants/modeExperience.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { SegmentedControl } from "../../patterns/SegmentedControl.jsx";
import { Caption, Body } from "../../primitives/Text.jsx";
import ExpenseSimulatorForm from "./ExpenseSimulatorForm.jsx";
import GoalsToolPanel from "./GoalsToolPanel.jsx";

function usePlannerTabs() {
  const { t } = useTranslation();
  return useMemo(
    () => [
      { id: "afford", label: t("tools.planner.tabAfford") },
      { id: "whatif", label: t("tools.planner.tabScenarios") },
      { id: "debt", label: t("tools.planner.tabDebt") },
      { id: "goals", label: t("tools.planner.tabGoals") },
    ],
    [t],
  );
}

function WhatIfTab() {
  const { t } = useTranslation();
  const { commitments, settings, getEffectiveStatus } = useCommitTrack();
  const mode = getExperienceMode(settings);
  const income = combinedMonthlyIncome(settings);
  const secondary = Math.max(0, Number(settings.secondaryMonthlyIncome) || 0);
  const primary = Math.max(0, Number(settings.monthlyIncome) || 0);

  const pack = buildQuickScenarioSummaries({
    primaryIncome: primary,
    secondaryMonthlyIncome: secondary,
    commitments,
    getEffectiveStatus,
    liquidSavings: settings.liquidSavings,
    mode,
  });

  return (
    <div className="ct-stack text-sm">
      <Caption>{t("tools.planner.whatifIntro")}</Caption>
      <Caption>
        {t("tools.planner.baselineFree", { amount: formatInr(pack.baselineFree) })}
        {pack.survivalMonths != null
          ? t("tools.planner.survivalMonths", { months: pack.survivalMonths })
          : ""}
      </Caption>
      <ul className="ct-stack-sm">
        {pack.rows.map((row) => (
          <li key={row.id} className="ct-card-flat ct-stack-sm !p-3">
            <Body className="!text-sm font-semibold">{row.label}</Body>
            <Caption className="ct-text-accent block">{row.headline}</Caption>
            <Caption className="block">{row.detail}</Caption>
          </li>
        ))}
      </ul>
      {income <= 0 && (
        <Caption className="ct-text-warning block">{t("tools.planner.setIncomeUnlock")}</Caption>
      )}
    </div>
  );
}

function DebtOrderTab() {
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

export default function MoneyPlannerPanel() {
  const { t } = useTranslation();
  const tabs = usePlannerTabs();
  const [tab, setTab] = useState("afford");

  return (
    <div className="ct-stack">
      <Caption>{t("tools.planner.intro")}</Caption>
      <SegmentedControl options={tabs} value={tab} onChange={setTab} />
      {tab === "afford" && <ExpenseSimulatorForm />}
      {tab === "whatif" && <WhatIfTab />}
      {tab === "debt" && <DebtOrderTab />}
      {tab === "goals" && <GoalsToolPanel />}
    </div>
  );
}
