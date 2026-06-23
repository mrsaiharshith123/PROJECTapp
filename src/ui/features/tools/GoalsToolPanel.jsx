import { useState, useRef, useMemo } from "react";
import { computeGoalProgress } from "../../../engines/goalsProgress.js";
import { analyzeSipForGoal } from "../../../engines/sipAdvisor.js";
import { commitmentToIncomeRatio } from "../../../engines/pressureAdvanced.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { INR } from "../../../constants/symbols.js";
import { Caption, Body } from "../../primitives/Text.jsx";
import { inputClassName } from "../../primitives/Input.jsx";
import { ProgressBar } from "../../patterns/ProgressBar.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { canAddGoal } from "../../../utils/tierAccess.js";
import { TierLimitBanner } from "../../patterns/TierLimitBanner.jsx";
import { SegmentedControl } from "../../patterns/SegmentedControl.jsx";
import { CelebrationOverlay } from "../../patterns/CelebrationOverlay.jsx";
import { ToolAnswerHero } from "../../patterns/ToolAnswerHero.jsx";
import { formatInr } from "../../../constants/symbols.js";
import { isSalariedFamily } from "../../../constants/modeExperience.js";

const GOAL_TYPE_IDS = ["reduce_open_debt", "income_ratio_cap", "save_amount", "education", "wedding"];
const fieldClass = `${inputClassName()} ct-input-tint`;

/** @param {string} id */
function goalTypeI18nKey(id) {
  const map = {
    reduce_open_debt: "reduceOpenDebt",
    income_ratio_cap: "incomeRatioCap",
    save_amount: "saveAmount",
    education: "education",
    wedding: "wedding",
  };
  return `goals.type.${map[id] || id}`;
}

export default function GoalsToolPanel({
  initialTitle = "",
  initialType = "save_amount",
}) {
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
    updateSettings,
    todayStr,
  } = usePerovo();
  const [goalLogAmounts, setGoalLogAmounts] = useState({});
  const [gType, setGType] = useState(initialType);
  const [gTitle, setGTitle] = useState(initialTitle);
  const [gTarget, setGTarget] = useState("");
  const [gTargetDate, setGTargetDate] = useState("");
  const [gForMember, setGForMember] = useState("shared");
  const [celebration, setCelebration] = useState(null);
  const celebratedGoals = useRef(new Set());
  const salariedFamily = isSalariedFamily(settings);

  const openRemaining = commitments.reduce((s, c) => {
    if (getEffectiveStatus(c) === "paid") return s;
    return s + Math.max(0, Number(c.remainingAmount ?? 0));
  }, 0);
  const income = combinedMonthlyIncome(settings);
  const ratio = commitmentToIncomeRatio(commitments, income, getEffectiveStatus);

  const goalGate = canAddGoal(settings, allGoals);

  const submitGoal = () => {
    if (!gTitle.trim()) return;
    if (!goalGate.ok) return;
    const base = { type: gType, title: gTitle.trim(), forMember: salariedFamily ? gForMember : "self" };
    if (gType === "reduce_open_debt") {
      addGoal({ ...base, targetReduction: Math.max(1, Number(gTarget) || 25000) });
    } else if (gType === "income_ratio_cap") {
      addGoal({ ...base, targetRatio: Math.min(0.9, Math.max(0.1, Number(gTarget) || 0.45)) });
    } else if (gType === "education" || gType === "wedding") {
      addGoal({
        ...base,
        type: gType,
        targetAmount: Math.max(1, Number(gTarget) || 100000),
        targetDate: gTargetDate || undefined,
      });
    } else {
      addGoal({
        ...base,
        targetAmount: Math.max(1, Number(gTarget) || 10000),
        targetDate: gTargetDate || undefined,
      });
    }
    setGTitle("");
    setGTarget("");
    setGTargetDate("");
  };

  const monthlyBurden = commitments.reduce(
    (s, c) => s + (getEffectiveStatus(c) === "paid" ? 0 : Math.max(0, Number(c.amount) || 0)),
    0,
  );
  const freeMoney = Math.max(0, income - monthlyBurden);
  const autoSaveRules = settings.goalAutoSaveRules || [];

  const goalHero = useMemo(() => {
    const active = allGoals.filter((g) => !g.archived);
    let totalSaved = 0;
    let onTrack = 0;
    active.forEach((g) => {
      const savedForGoal =
        g.type === "save_amount" || g.type === "education" || g.type === "wedding"
          ? Number(g.savedAmount) || 0
          : 0;
      totalSaved += savedForGoal;
      const p = computeGoalProgress(g, {
        openRemainingSum: openRemaining,
        burdenRatio: ratio,
        savedAmountTowardGoal: savedForGoal,
      });
      if (p >= 0.5) onTrack += 1;
    });
    return { totalSaved, onTrack, total: active.length };
  }, [allGoals, openRemaining, ratio]);

  const toggleSalaryAutoSave = (goalId, defaultAmount) => {
    const exists = autoSaveRules.some((r) => String(r.goalId) === String(goalId));
    if (exists) {
      updateSettings({
        goalAutoSaveRules: autoSaveRules.filter((r) => String(r.goalId) !== String(goalId)),
      });
    } else {
      updateSettings({
        goalAutoSaveRules: [...autoSaveRules, { goalId, amount: defaultAmount }],
      });
    }
  };

  return (
    <div className="ct-stack">
      <ToolAnswerHero
        tone="wealth"
        label={t("tools.goals.heroLabel")}
        value={formatInr(goalHero.totalSaved)}
        subtitle={
          goalHero.total > 0
            ? t("tools.goals.heroSubtitle", { onTrack: goalHero.onTrack, total: goalHero.total })
            : undefined
        }
      />
      <Caption>{t("goals.intro")}</Caption>
      {!goalGate.ok && (
        <TierLimitBanner
          title={t("tier.limit.goalsTitle")}
          message={t("tier.limit.goalsMessage", { limit: goalGate.limit })}
        />
      )}
      <div>
        <label className="ct-field-label">{t("goals.typeLabel")}</label>
        <select className={fieldClass} value={gType} onChange={(e) => setGType(e.target.value)}>
          {GOAL_TYPE_IDS.map((id) => (
            <option key={id} value={id}>
              {t(goalTypeI18nKey(id))}
            </option>
          ))}
        </select>
      </div>
      {salariedFamily ? (
        <div>
          <label className="ct-field-label">{t("goals.forMemberLabel")}</label>
          <SegmentedControl
            options={[
              { id: "shared", label: t("goals.forMember.shared") },
              { id: "self", label: t("goals.forMember.self") },
              { id: "spouse", label: t("goals.forMember.spouse") },
            ]}
            value={gForMember}
            onChange={setGForMember}
          />
        </div>
      ) : null}
      <div>
        <label className="ct-field-label">{t("goals.nameLabel")}</label>
        <input
          className={fieldClass}
          value={gTitle}
          onChange={(e) => setGTitle(e.target.value)}
          placeholder={t("goals.phName")}
        />
      </div>
      <div>
        <label className="ct-field-label">
          {gType === "income_ratio_cap" ? t("goals.targetRatio") : t("goals.targetAmount", { currency: INR })}
        </label>
        <input className={fieldClass} value={gTarget} onChange={(e) => setGTarget(e.target.value)} inputMode="decimal" />
      </div>
      {(gType === "save_amount" || gType === "education" || gType === "wedding") && (
        <div>
          <label className="ct-field-label">{t("goals.targetDate")}</label>
          <input
            type="date"
            className={fieldClass}
            value={gTargetDate}
            onChange={(e) => setGTargetDate(e.target.value)}
          />
        </div>
      )}
      <button type="button" className="ct-btn ct-btn-primary w-full" onClick={submitGoal} disabled={!goalGate.ok}>
        {t("goals.addGoal")}
      </button>
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
            const sipPlan =
              (g.type === "save_amount" || g.type === "education" || g.type === "wedding") &&
              Number(g.targetAmount) > 0
                ? analyzeSipForGoal({
                    targetAmount: g.targetAmount,
                    targetDate: g.targetDate,
                    todayStr,
                    monthlyFreeCash: freeMoney,
                  })
                : null;
            return (
              <div key={g.id} className="ct-card-flat ct-stack-sm !p-3">
                <div className="ct-row-between gap-2">
                  <div className="min-w-0">
                    <Body className="font-semibold truncate">{g.title}</Body>
                    <Caption>{t(goalTypeI18nKey(g.type))}</Caption>
                    <div className="mt-2">
                      <ProgressBar value={Math.round(p * 100)} />
                    </div>
                    {sipPlan?.monthlySipNeeded > 0 && (
                      <Caption className="block mt-1">
                        {t("goals.sipNeeded", {
                          amount: sipPlan.monthlySipNeeded.toLocaleString("en-IN"),
                          years: sipPlan.years,
                        })}
                        {!sipPlan.affordable ? ` · ${t("goals.sipTight")}` : ""}
                      </Caption>
                    )}
                    {savedForGoal > 0 && (
                      <Caption className="block mt-0.5">
                        {t("goals.savedSoFar", { amount: savedForGoal.toLocaleString("en-IN") })}
                      </Caption>
                    )}
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
                  <>
                    <div className="ct-row gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder={t("goals.addAmount", { currency: INR })}
                        className={`${fieldClass} flex-1 !py-1.5 !text-xs`}
                        value={goalLogAmounts[g.id] ?? ""}
                        onChange={(e) => setGoalLogAmounts((prev) => ({ ...prev, [g.id]: e.target.value }))}
                      />
                      <button
                        type="button"
                        className="ct-btn ct-btn-outline ct-btn-sm shrink-0"
                        onClick={() => {
                          const amt = Number(goalLogAmounts[g.id]) || 0;
                          logSavingsToGoal(g.id, amt);
                          setGoalLogAmounts((prev) => ({ ...prev, [g.id]: "" }));
                          const savedAfter = (Number(g.savedAmount) || 0) + amt;
                          if (
                            Number(g.targetAmount) > 0 &&
                            savedAfter >= Number(g.targetAmount) &&
                            !celebratedGoals.current.has(g.id)
                          ) {
                            celebratedGoals.current.add(g.id);
                            setCelebration({ type: "trophy", message: t("celebration.goalAchieved") });
                          }
                        }}
                      >
                        {t("common.add")}
                      </button>
                    </div>
                    {settings.salaryCreditDay && (
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoSaveRules.some((r) => String(r.goalId) === String(g.id))}
                          onChange={() =>
                            toggleSalaryAutoSave(
                              g.id,
                              Math.max(500, Math.round((sipPlan?.monthlySipNeeded || 5000) / 100) * 100),
                            )
                          }
                        />
                        {t("goals.salaryAutoSave", { day: settings.salaryCreditDay })}
                      </label>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="ct-stat-tile">
        <p className="ct-stat-tile-label">{t("tools.goals.disclaimer")}</p>
      </div>
      {celebration ? (
        <CelebrationOverlay
          type={celebration.type}
          show
          message={celebration.message}
          onComplete={() => setCelebration(null)}
        />
      ) : null}
    </div>
  );
}
