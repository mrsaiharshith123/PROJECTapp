import { useMemo, useState } from "react";
import Card from "../components/Card";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import { simulatePrepayment } from "../engines/prepayment.js";
import { computeGoalProgress, goalTypeLabel } from "../engines/goalsProgress.js";
import { commitmentToIncomeRatio } from "../engines/pressureAdvanced.js";
import { totalMonthlyBurden } from "../engines/burden.js";
import { comparePayoffStrategies } from "../engines/payoffOptimizer.js";

const goalTypes = [
  { value: "reduce_open_debt", label: "Reduce open debt by amount" },
  { value: "income_ratio_cap", label: "Cap burden vs income" },
  { value: "save_amount", label: "Save / buffer target" },
];

const Tools = () => {
  const { goals, addGoal, deleteGoal, commitments, settings, getEffectiveStatus, logSavingsToGoal } =
    useCommitTrack();
  const [goalLogAmounts, setGoalLogAmounts] = useState({});

  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("10.5");
  const [emi, setEmi] = useState("");
  const [extra, setExtra] = useState("");
  const [payoffExtra, setPayoffExtra] = useState("");

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
  const income = Math.max(0, Number(settings.monthlyIncome) || 0);
  const ratio = commitmentToIncomeRatio(commitments, income, getEffectiveStatus);
  const burden = totalMonthlyBurden(commitments, getEffectiveStatus);

  const [gType, setGType] = useState("reduce_open_debt");
  const [gTitle, setGTitle] = useState("");
  const [gTarget, setGTarget] = useState("");

  const submitGoal = () => {
    if (!gTitle.trim()) return;
    const base = {
      type: gType,
      title: gTitle.trim(),
    };
    if (gType === "reduce_open_debt") {
      addGoal({
        ...base,
        targetReduction: Math.max(1, Number(gTarget) || 25000),
      });
    } else if (gType === "income_ratio_cap") {
      addGoal({
        ...base,
        targetRatio: Math.min(0.9, Math.max(0.1, Number(gTarget) || 0.45)),
      });
    } else {
      addGoal({
        ...base,
        targetAmount: Math.max(1, Number(gTarget) || 10000),
      });
    }
    setGTitle("");
    setGTarget("");
  };

  return (
    <div className="space-y-6 pb-6">
      <div>
        <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">Optimization</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
          Tools
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Simulators and goals run locally. Not financial advice.
        </p>
      </div>

      <Card className="space-y-4">
        <h2 className="text-base font-semibold text-gray-800">EMI prepayment simulator</h2>
        <p className="text-xs text-gray-500">
          Enter current principal, annual rate, your EMI, and extra principal per month. Uses standard
          monthly reducing balance.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600">Outstanding principal (₹)</label>
            <input
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Annual interest %</label>
            <input
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Scheduled EMI (₹)</label>
            <input
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm"
              value={emi}
              onChange={(e) => setEmi(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Extra monthly (₹)</label>
            <input
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
            />
          </div>
        </div>
        {sim && (
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-sm text-indigo-900 space-y-1">
            <p>
              <span className="font-semibold">Months saved:</span> {sim.monthsSaved} (baseline{" "}
              {sim.baselineMonths} → {sim.acceleratedMonths} months)
            </p>
            <p>
              <span className="font-semibold">Interest saved (approx):</span> ₹
              {Math.round(sim.interestSaved).toLocaleString()}
            </p>
          </div>
        )}
      </Card>

      <Card className="space-y-4">
        <h2 className="text-base font-semibold text-gray-800">Debt payoff optimizer</h2>
        <p className="text-xs text-gray-500">Snowball vs avalanche using open balances. Optional extra monthly pool.</p>
        <div>
          <label className="text-xs font-semibold text-gray-600">Extra monthly toward debt (₹)</label>
          <input
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm"
            value={payoffExtra}
            onChange={(e) => setPayoffExtra(e.target.value)}
            placeholder="0"
          />
        </div>
        {payoff.debts.length === 0 ? (
          <p className="text-xs text-gray-400">No open debts to optimize.</p>
        ) : (
          <div className="space-y-3 text-sm">
            {payoff.recommendation && (
              <p className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-indigo-900">
                <span className="font-semibold">{payoff.recommendation.label}</span>
                {payoff.recommendation.firstPay && (
                  <span> — start with {payoff.recommendation.firstPay.name}</span>
                )}
                <span className="block text-xs mt-1">{payoff.recommendation.reason}</span>
              </p>
            )}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Snowball order</p>
              <ol className="list-decimal list-inside text-gray-700 mt-1">
                {payoff.snowball.map((d) => (
                  <li key={d.id}>
                    {d.name} · ₹{d.balance.toLocaleString()} · {d.interestRate}% APR
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Avalanche order</p>
              <ol className="list-decimal list-inside text-gray-700 mt-1">
                {payoff.avalanche.map((d) => (
                  <li key={d.id}>
                    {d.name} · ₹{d.balance.toLocaleString()} · {d.interestRate}% APR
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Card>

      <Card className="space-y-4">
        <h2 className="text-base font-semibold text-gray-800">Financial goals</h2>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-600">Goal type</label>
          <select
            className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
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
          <label className="text-xs font-semibold text-gray-600">Title</label>
          <input
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm"
            value={gTitle}
            onChange={(e) => setGTitle(e.target.value)}
            placeholder="e.g. Clear card balance"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600">
            {gType === "reduce_open_debt"
              ? "Target reduction (₹)"
              : gType === "income_ratio_cap"
                ? "Target max ratio (0–1, e.g. 0.45)"
                : "Target amount (₹)"}
          </label>
          <input
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm"
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

        <div className="border-t border-gray-100 pt-3 space-y-2">
          {goals.length === 0 ? (
            <p className="text-xs text-gray-400">No goals yet.</p>
          ) : (
            goals.map((g) => {
              const savedForGoal = g.type === "save_amount" ? Number(g.savedAmount) || 0 : 0;
              const ctx = {
                openRemainingSum: openRemaining,
                burdenRatio: ratio,
                savedAmountTowardGoal: savedForGoal,
              };
              const p = computeGoalProgress(g, ctx);
              return (
                <div key={g.id} className="border border-gray-100 rounded-xl p-2 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{g.title}</p>
                      <p className="text-xs text-gray-500">{goalTypeLabel(g.type)}</p>
                      {g.type === "save_amount" && (
                        <p className="text-[10px] text-emerald-700">
                          Saved: ₹{Number(g.savedAmount || 0).toLocaleString()}
                          {g.targetAmount ? ` / ₹${Number(g.targetAmount).toLocaleString()}` : ""}
                        </p>
                      )}
                      <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.round(p * 100)}%` }}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteGoal(g.id)}
                      className="text-xs text-red-500 shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                  {g.type === "save_amount" && (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Log ₹"
                        className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs"
                        value={goalLogAmounts[g.id] ?? ""}
                        onChange={(e) =>
                          setGoalLogAmounts((prev) => ({ ...prev, [g.id]: e.target.value }))
                        }
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
      </Card>

      <Card className="text-xs text-gray-500">
        Current open remaining: ₹{openRemaining.toLocaleString()} · Burden/income:{" "}
        {income > 0 ? `${Math.round(ratio * 100)}%` : "—"} · Monthly burden est.: ₹
        {Math.round(burden).toLocaleString()}
      </Card>
    </div>
  );
};

export default Tools;
