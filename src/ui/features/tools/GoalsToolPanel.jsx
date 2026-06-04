import { useState } from "react";
import { computeGoalProgress, goalTypeLabel } from "../../../engines/goalsProgress.js";
import { commitmentToIncomeRatio } from "../../../engines/pressureAdvanced.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { INR } from "../../../constants/symbols.js";
import { Caption, Body } from "../../primitives/Text.jsx";
import { Button } from "../../primitives/Button.jsx";
import { ProgressBar } from "../../patterns/ProgressBar.jsx";

const goalTypes = [
  { value: "reduce_open_debt", label: "Pay down total debt" },
  { value: "income_ratio_cap", label: "Keep bills below % of income" },
  { value: "save_amount", label: "Save a set amount" },
  { value: "education", label: "Child education fund" },
  { value: "wedding", label: "Wedding / event fund" },
];

export default function GoalsToolPanel() {
  const {
    allGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    commitments,
    settings,
    getEffectiveStatus,
    logSavingsToGoal,
  } = useCommitTrack();
  const [goalLogAmounts, setGoalLogAmounts] = useState({});
  const [gType, setGType] = useState("reduce_open_debt");
  const [gTitle, setGTitle] = useState("");
  const [gTarget, setGTarget] = useState("");

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

  return (
    <div className="ct-stack">
      <Caption>Set a target and track progress — separate from day-to-day bills.</Caption>
      <div>
        <label className="ct-metric-label block">Goal type</label>
        <select className="ct-input mt-1" value={gType} onChange={(e) => setGType(e.target.value)}>
          {goalTypes.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="ct-metric-label block">Name</label>
        <input
          className="ct-input mt-1"
          value={gTitle}
          onChange={(e) => setGTitle(e.target.value)}
          placeholder="e.g. Emergency fund"
        />
      </div>
      <div>
        <label className="ct-metric-label block">
          {gType === "reduce_open_debt"
            ? `Target (${INR})`
            : gType === "income_ratio_cap"
              ? "Max % of income (0.45 = 45%)"
              : `Target (${INR})`}
        </label>
        <input className="ct-input mt-1" value={gTarget} onChange={(e) => setGTarget(e.target.value)} inputMode="decimal" />
      </div>
      <Button type="button" onClick={submitGoal}>
        Add goal
      </Button>
      <div className="ct-stack-sm pt-2 border-t border-[var(--ct-border)]">
        {allGoals.length === 0 ? (
          <Caption>No goals yet.</Caption>
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
              <div key={g.id} className="ct-card-flat ct-stack-sm !p-3">
                <div className="ct-row-between gap-2">
                  <div className="min-w-0">
                    <Body className="font-semibold truncate">{g.title}</Body>
                    <Caption>{goalTypeLabel(g.type)}</Caption>
                    <div className="mt-2">
                      <ProgressBar value={Math.round(p * 100)} />
                    </div>
                  </div>
                  <div className="ct-stack-sm shrink-0">
                    <button
                      type="button"
                      onClick={() => updateGoal(g.id, { active: !g.active })}
                      className="ct-link !text-xs"
                    >
                      {g.active === false ? "Resume" : "Pause"}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateGoal(g.id, { archived: true, active: false })}
                      className="ct-link !text-xs"
                    >
                      Archive
                    </button>
                    <button type="button" onClick={() => deleteGoal(g.id)} className="ct-link !text-xs">
                      Delete
                    </button>
                  </div>
                </div>
                {(g.type === "save_amount" || g.type === "education" || g.type === "wedding") && (
                  <div className="ct-row gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder={`Add ${INR}`}
                      className="ct-input flex-1 !py-1.5 !text-xs"
                      value={goalLogAmounts[g.id] ?? ""}
                      onChange={(e) => setGoalLogAmounts((prev) => ({ ...prev, [g.id]: e.target.value }))}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        logSavingsToGoal(g.id, goalLogAmounts[g.id]);
                        setGoalLogAmounts((prev) => ({ ...prev, [g.id]: "" }));
                      }}
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
