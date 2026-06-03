import { useMemo, useState } from "react";
import { ToolTile } from "../ToolTile.jsx";
import { Modal } from "../../primitives/Modal.jsx";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { simulatePrepayment } from "../../../engines/prepayment.js";
import { computeGoalProgress, goalTypeLabel } from "../../../engines/goalsProgress.js";
import { commitmentToIncomeRatio } from "../../../engines/pressureAdvanced.js";
import { comparePayoffStrategies } from "../../../engines/payoffOptimizer.js";
import InsuranceCalculatorModal from "../modals/InsuranceCalculatorModal.jsx";
import { getToolsForMode, getDashboardToolsHeading, getExperienceMode } from "../../../constants/modeExperience.js";
import { TOOL_ICONS, formatInr, INR, EM_DASH, ARROW } from "../../../constants/symbols.js";
import ExpenseSimulatorForm from "../tools/ExpenseSimulatorForm.jsx";
import ChitFundAdvisor from "../tools/ChitFundAdvisor.jsx";
import BondAdvisor from "../tools/BondAdvisor.jsx";
import LoanPayoffAdvisor from "../tools/LoanPayoffAdvisor.jsx";
import QuickScenariosPanel from "../tools/QuickScenariosPanel.jsx";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { orderDashboardWidgets } from "../../../utils/dashboardToolOrder.js";

const goalTypes = [
  { value: "reduce_open_debt", label: "Pay down total debt" },
  { value: "income_ratio_cap", label: "Keep bills below % of income" },
  { value: "save_amount", label: "Save a set amount" },
  { value: "education", label: "Child education fund" },
  { value: "wedding", label: "Wedding / event fund" },
];

/** Calculator widgets + modals — embedded on Home dashboard. */
export default function DashboardTools() {
  const {
    allGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    commitments,
    settings,
    getEffectiveStatus,
    getEffectiveLendingStatus,
    lendings,
    logSavingsToGoal,
    todayStr,
    updateSettings,
  } = useCommitTrack();
  const toolMode = getExperienceMode(settings);
  const widgets = useMemo(() => {
    const defaultToolList = getToolsForMode(settings);
    return /** @type {{ id: string, title: string, subtitle?: string, accent?: string, icon?: string }[]} */ (
      orderDashboardWidgets(defaultToolList, settings.dashboardToolOrderByMode?.[toolMode]).map((t) => ({
        ...t,
        icon: TOOL_ICONS[t.id],
      }))
    );
  }, [settings, toolMode]);
  const toolsHeading = getDashboardToolsHeading(settings);
  const [activeTool, setActiveTool] = useState(null);
  const [reorderTools, setReorderTools] = useState(false);
  const [goalLogAmounts, setGoalLogAmounts] = useState({});
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("10.5");
  const [emi, setEmi] = useState("");
  const [extra, setExtra] = useState("");
  const [payoffExtra, setPayoffExtra] = useState("");
  const [gType, setGType] = useState("reduce_open_debt");
  const [gTitle, setGTitle] = useState("");
  const [gTarget, setGTarget] = useState("");

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

  const payoff = useMemo(() => {
    const x = Number(payoffExtra) || 0;
    return comparePayoffStrategies(commitments, getEffectiveStatus, x);
  }, [commitments, getEffectiveStatus, payoffExtra]);

  const openRemaining = commitments.reduce((s, c) => {
    if (getEffectiveStatus(c) === "paid") return s;
    return s + Math.max(0, Number(c.remainingAmount ?? 0));
  }, 0);
  const income = combinedMonthlyIncome(settings);
  const ratio = commitmentToIncomeRatio(commitments, income, getEffectiveStatus);

  const submitGoal = () => {
    if (!gTitle.trim()) return;
    const base = { type: gType, title: gTitle.trim() };
    if (gType === "reduce_open_debt") {
      addGoal({ ...base, targetReduction: Math.max(1, Number(gTarget) || 25000) });
    } else if (gType === "income_ratio_cap") {
      addGoal({ ...base, targetRatio: Math.min(0.9, Math.max(0.1, Number(gTarget) || 0.45)) });
    } else if (gType === "education" || gType === "wedding") {
      addGoal({ ...base, type: gType, targetAmount: Math.max(1, Number(gTarget) || 100000) });
    } else {
      addGoal({ ...base, targetAmount: Math.max(1, Number(gTarget) || 10000) });
    }
    setGTitle("");
    setGTarget("");
  };

  const closeTool = () => setActiveTool(null);

  const persistToolOrder = (orderedIds) => {
    const prev = settings.dashboardToolOrderByMode && typeof settings.dashboardToolOrderByMode === "object"
      ? { ...settings.dashboardToolOrderByMode }
      : {};
    prev[toolMode] = orderedIds;
    updateSettings({ dashboardToolOrderByMode: prev });
  };

  const moveTool = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= widgets.length || fromIndex === toIndex) return;
    const ids = widgets.map((w) => w.id);
    const [moved] = ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, moved);
    persistToolOrder(ids);
  };

  const resetToolOrder = () => {
    const prev = settings.dashboardToolOrderByMode && typeof settings.dashboardToolOrderByMode === "object"
      ? { ...settings.dashboardToolOrderByMode }
      : {};
    delete prev[toolMode];
    updateSettings({ dashboardToolOrderByMode: prev });
  };

  return (
    <section className="space-y-3" id="dashboard-tools">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100">{toolsHeading}</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {reorderTools ? "Use arrows to move tiles — order is saved for this mode." : "Tap a tile — options match your user mode."}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {reorderTools && (
            <button
              type="button"
              className="text-xs font-medium text-gray-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              onClick={resetToolOrder}
            >
              Reset order
            </button>
          )}
          <button
            type="button"
            onClick={() => setReorderTools((v) => !v)}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
              reorderTools
                ? "border-indigo-500 bg-indigo-50 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200"
                : "border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-indigo-300"
            }`}
          >
            {reorderTools ? "Done" : "Reorder"}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {widgets.map((t, i) =>
          reorderTools ? (
            <div key={t.id} className="flex gap-1.5 items-stretch min-h-[9.5rem]">
              <div className="flex flex-col justify-center gap-0.5 shrink-0 py-1">
                <button
                  type="button"
                  disabled={i === 0}
                  aria-label="Move up"
                  onClick={() => moveTool(i, i - 1)}
                  className="w-8 h-8 rounded-lg border border-gray-200 dark:border-slate-600 text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={i === widgets.length - 1}
                  aria-label="Move down"
                  onClick={() => moveTool(i, i + 1)}
                  className="w-8 h-8 rounded-lg border border-gray-200 dark:border-slate-600 text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  ↓
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <ToolTile
                  icon={t.icon}
                  title={t.title}
                  subtitle={t.subtitle}
                  accent={t.accent}
                  onClick={() => {}}
                  disabled
                />
              </div>
            </div>
          ) : (
            <ToolTile
              key={t.id}
              icon={t.icon}
              title={t.title}
              subtitle={t.subtitle}
              accent={t.accent}
              onClick={() => setActiveTool(t.id)}
            />
          )
        )}
      </div>

      {activeTool === "afford" && (
        <Modal title={widgets.find((w) => w.id === "afford")?.title || "Can I afford this?"} onClose={closeTool}>
          <ExpenseSimulatorForm />
        </Modal>
      )}

      {activeTool === "scenarios" && (
        <Modal title={widgets.find((w) => w.id === "scenarios")?.title || "What-if stress test"} onClose={closeTool}>
          <QuickScenariosPanel />
        </Modal>
      )}

      {activeTool === "insurance" && (
        <InsuranceCalculatorModal
          commitments={commitments}
          todayStr={todayStr}
          monthlyIncome={income}
          onClose={closeTool}
        />
      )}

      {activeTool === "emi" && (
        <Modal title="Pay loan faster" onClose={closeTool}>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
            See how many months you save if you pay a little extra on your loan each month.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">Loan left ({INR})</label>
              <input
                className="mt-1 ct-input"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">Interest % per year</label>
              <input
                className="mt-1 ct-input"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">Your EMI ({INR})</label>
              <input
                className="mt-1 ct-input"
                value={emi}
                onChange={(e) => setEmi(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">Extra per month ({INR})</label>
              <input
                className="mt-1 ct-input"
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
              />
            </div>
          </div>
          {sim && (
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800 p-4 text-sm text-indigo-900 dark:text-indigo-100 space-y-1 mt-4">
              <p>
                <span className="font-semibold">Months saved:</span> {sim.monthsSaved} ({sim.baselineMonths} {ARROW}{" "}
                {sim.acceleratedMonths} months)
              </p>
              <p>
                <span className="font-semibold">Interest saved (about):</span> {formatInr(Math.round(sim.interestSaved))}
              </p>
            </div>
          )}
        </Modal>
      )}

      {activeTool === "loanTiming" && (
        <Modal title="Loan extra payment planner" onClose={closeTool}>
          <LoanPayoffAdvisor
            commitments={commitments}
            lendings={lendings}
            settings={settings}
            getEffectiveStatus={getEffectiveStatus}
            getEffectiveLendingStatus={getEffectiveLendingStatus}
            todayStr={todayStr}
          />
        </Modal>
      )}

      {activeTool === "chit" && (
        <Modal title="Chit timing advisor" onClose={closeTool}>
          <ChitFundAdvisor
            commitments={commitments}
            settings={settings}
            getEffectiveStatus={getEffectiveStatus}
            todayStr={todayStr}
          />
        </Modal>
      )}

      {activeTool === "bond" && (
        <Modal title="Bond return advisor" onClose={closeTool}>
          <BondAdvisor monthlyIncome={income} />
        </Modal>
      )}

      {activeTool === "payoff" && (
        <Modal title="Which debt to pay first?" onClose={closeTool}>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
            Two common ways: pay smallest balance first (easier wins) or highest interest first (saves more money).
          </p>
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
              Extra money for debt each month ({INR})
            </label>
            <input
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-sm"
              value={payoffExtra}
              onChange={(e) => setPayoffExtra(e.target.value)}
              placeholder="0"
            />
          </div>
          {payoff.debts.length === 0 ? (
            <p className="text-xs text-gray-400">No open debts to sort.</p>
          ) : (
            <div className="space-y-3 text-sm">
              {payoff.recommendation && (
                <p className="rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800 p-3 text-indigo-900 dark:text-indigo-100">
                  <span className="font-semibold">{payoff.recommendation.label}</span>
                  {payoff.recommendation.firstPay && (
                    <span>
                      {" "}
                      {EM_DASH} start with {payoff.recommendation.firstPay.name}
                    </span>
                  )}
                  <span className="block text-xs mt-1">{payoff.recommendation.reason}</span>
                </p>
              )}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Smallest balance first</p>
                <ol className="list-decimal list-inside text-gray-700 dark:text-slate-300 mt-1">
                  {payoff.snowball.map((d) => (
                    <li key={d.id}>
                      {d.name} {EM_DASH} {formatInr(d.balance)} {EM_DASH} {d.interestRate}% interest
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Highest interest first</p>
                <ol className="list-decimal list-inside text-gray-700 dark:text-slate-300 mt-1">
                  {payoff.avalanche.map((d) => (
                    <li key={d.id}>
                      {d.name} {EM_DASH} {formatInr(d.balance)} {EM_DASH} {d.interestRate}% interest
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </Modal>
      )}

      {activeTool === "goals" && (
        <Modal title="Savings goals" onClose={closeTool}>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">Goal type</label>
              <select
                className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                value={gType}
                onChange={(e) => setGType(e.target.value)}
              >
                {goalTypes.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">Name your goal</label>
              <input
                className="mt-1 ct-input"
                value={gTitle}
                onChange={(e) => setGTitle(e.target.value)}
                placeholder="e.g. Emergency fund"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                {gType === "reduce_open_debt"
                  ? `Target (${INR})`
                  : gType === "income_ratio_cap"
                    ? "Max % of income (0.45 = 45%)"
                    : gType === "education" || gType === "wedding"
                      ? `Target fund (${INR})`
                      : `Save (${INR})`}
              </label>
              <input
                className="mt-1 ct-input"
                value={gTarget}
                onChange={(e) => setGTarget(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={submitGoal}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
            >
              Add goal
            </button>
            <div className="border-t border-gray-100 dark:border-slate-700 pt-3 space-y-2">
              {allGoals.length === 0 ? (
                <p className="text-xs text-gray-400">No goals yet.</p>
              ) : (
                allGoals.map((g) => {
                  if (g.archived) return null;
                  const savedForGoal =
                    g.type === "save_amount" || g.type === "education" || g.type === "wedding"
                      ? Number(g.savedAmount) || 0
                      : 0;
                  const p = computeGoalProgress(g, {
                    openRemainingSum: openRemaining,
                    burdenRatio: ratio,
                    savedAmountTowardGoal: savedForGoal,
                  });
                  return (
                    <div key={g.id} className="border border-gray-100 dark:border-slate-700 rounded-xl p-2 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 dark:text-slate-100 truncate">{g.title}</p>
                          <p className="text-xs text-gray-500">{goalTypeLabel(g.type)}</p>
                          <div className="mt-1 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.round(p * 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateGoal(g.id, { active: !g.active })}
                            className="text-xs text-amber-600 font-semibold"
                          >
                            {g.active === false ? "Resume" : "Pause"}
                          </button>
                          <button
                            type="button"
                            onClick={() => updateGoal(g.id, { archived: true, active: false })}
                            className="text-xs text-gray-500"
                          >
                            Archive
                          </button>
                          <button type="button" onClick={() => deleteGoal(g.id)} className="text-xs text-red-500">
                            Delete
                          </button>
                        </div>
                      </div>
                      {(g.type === "save_amount" || g.type === "education" || g.type === "wedding") && (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            placeholder={`Add ${INR}`}
                            className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-xs"
                            value={goalLogAmounts[g.id] ?? ""}
                            onChange={(e) => setGoalLogAmounts((prev) => ({ ...prev, [g.id]: e.target.value }))}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              logSavingsToGoal(g.id, goalLogAmounts[g.id]);
                              setGoalLogAmounts((prev) => ({ ...prev, [g.id]: "" }));
                            }}
                            className="px-2 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                          >
                            Add
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
