import { useMemo, useState } from "react";
import { formatInr, INR, EM_DASH } from "../../../constants/symbols.js";
import { buildQuickScenarioSummaries } from "../../../engines/quickScenarios.js";
import { comparePayoffStrategies } from "../../../engines/payoffOptimizer.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { getExperienceMode } from "../../../constants/modeExperience.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { SegmentedControl } from "../../patterns/SegmentedControl.jsx";
import { Caption, Body } from "../../primitives/Text.jsx";
import ExpenseSimulatorForm from "./ExpenseSimulatorForm.jsx";
import GoalsToolPanel from "./GoalsToolPanel.jsx";

const TABS = [
  { id: "afford", label: "Afford" },
  { id: "whatif", label: "What-if" },
  { id: "debt", label: "Debt order" },
  { id: "goals", label: "Goals" },
];

function WhatIfTab() {
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
      <Caption>
        Quick what-ifs — same affordability engine as Afford. Does not change your data.
      </Caption>
      <Caption>
        Baseline free cash ~{formatInr(pack.baselineFree)}/mo
        {pack.survivalMonths != null ? ` · survival if income stops ~${pack.survivalMonths} mo` : ""}
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
        <Caption className="ct-text-warning block">Set income in Profile to unlock job-loss and fee scenarios.</Caption>
      )}
    </div>
  );
}

function DebtOrderTab() {
  const { commitments, getEffectiveStatus } = useCommitTrack();
  const [payoffExtra, setPayoffExtra] = useState("");
  const payoff = useMemo(() => {
    const x = Number(payoffExtra) || 0;
    return comparePayoffStrategies(commitments, getEffectiveStatus, x);
  }, [commitments, getEffectiveStatus, payoffExtra]);

  return (
    <div className="ct-stack">
      <Caption>
        Two common ways: smallest balance first (quick wins) or highest interest first (saves more).
      </Caption>
      <div>
        <label className="ct-metric-label block">Extra for debt each month ({INR})</label>
        <input
          className="ct-input mt-1"
          value={payoffExtra}
          onChange={(e) => setPayoffExtra(e.target.value)}
          placeholder="0"
          inputMode="numeric"
        />
      </div>
      {payoff.debts.length === 0 ? (
        <Caption>No open debts to sort — add loans or EMIs as bills.</Caption>
      ) : (
        <div className="ct-stack-sm">
          {payoff.recommendation && (
            <div className="ct-insight-accent">
              <Body className="!text-sm font-semibold">{payoff.recommendation.label}</Body>
              {payoff.recommendation.firstPay && (
                <Caption className="block">
                  Start with {payoff.recommendation.firstPay.name} {EM_DASH} {payoff.recommendation.reason}
                </Caption>
              )}
            </div>
          )}
          <div>
            <Caption className="font-semibold block">Smallest balance first</Caption>
            <ol className="list-decimal list-inside ct-stack-sm">
              {payoff.snowball.map((d) => (
                <li key={d.id}>
                  {d.name} {EM_DASH} {formatInr(d.balance)} {EM_DASH} {d.interestRate}%
                </li>
              ))}
            </ol>
          </div>
          <div>
            <Caption className="font-semibold block">Highest interest first</Caption>
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
  const [tab, setTab] = useState("afford");

  return (
    <div className="ct-stack">
      <Caption>One place to test spends, shocks, which debt to clear first, and savings targets.</Caption>
      <SegmentedControl options={TABS} value={tab} onChange={setTab} />
      {tab === "afford" && <ExpenseSimulatorForm />}
      {tab === "whatif" && <WhatIfTab />}
      {tab === "debt" && <DebtOrderTab />}
      {tab === "goals" && <GoalsToolPanel />}
    </div>
  );
}
