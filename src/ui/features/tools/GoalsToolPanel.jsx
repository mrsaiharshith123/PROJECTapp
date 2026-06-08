import { useState } from "react";
import { computeGoalProgress } from "../../../engines/goalsProgress.js";
import { commitmentToIncomeRatio } from "../../../engines/pressureAdvanced.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { INR } from "../../../constants/symbols.js";
import { Caption, Body } from "../../primitives/Text.jsx";
import { Button } from "../../primitives/Button.jsx";
import { ProgressBar } from "../../patterns/ProgressBar.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";

const GOAL_TYPE_IDS = ["reduce_open_debt", "income_ratio_cap", "save_amount", "education", "wedding"];

export default function GoalsToolPanel() {
  const { t } = useTranslation();
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
      <Caption>{t("goals.intro")}</Caption>
      <div>
        <label className="ct-metric-label block">{t("goals.typeLabel")}</label>
        <select className="ct-input mt-1" value={gType} onChange={(e) => setGType(e.target.value)}>
          {GOAL_TYPE_IDS.map((id) => (
            <option key={id} value={id}>
              {t(`goals.type.${id}`)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="ct-metric-label block">{t("goals.nameLabel")}</label>
        <input
          className="ct-input mt-1"
          value={gTitle}
          onChange={(e) => setGTitle(e.target.value)}
          placeholder={t("goals.phName")}
        />
      </div>
      <div>
        <label className="ct-metric-label block">
          {gType === "income_ratio_cap" ? t("goals.targetRatio") : t("goals.targetAmount", { currency: INR })}
        </label>
        <input className="ct-input mt-1" value={gTarget} onChange={(e) => setGTarget(e.target.value)} inputMode="decimal" />
      </div>
      <Button type="button" onClick={submitGoal}>
        {t("goals.addGoal")}
      </Button>
      <div className="ct-stack-sm pt-2 border-t border-[var(--ct-border)]">
        {allGoals.length === 0 ? (
          <Caption>{t("goals.empty")}</Caption>
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
                    <Caption>{t(`goals.type.${g.type}`)}</Caption>
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
                      {g.active === false ? t("goals.resume") : t("goals.pause")}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateGoal(g.id, { archived: true, active: false })}
                      className="ct-link !text-xs"
                    >
                      {t("goals.archive")}
                    </button>
                    <button type="button" onClick={() => deleteGoal(g.id)} className="ct-link !text-xs">
                      {t("common.delete")}
                    </button>
                  </div>
                </div>
                {(g.type === "save_amount" || g.type === "education" || g.type === "wedding") && (
                  <div className="ct-row gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder={t("goals.addAmount", { currency: INR })}
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
                      {t("common.add")}
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
