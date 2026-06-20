import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { computeGoalProgress } from "../../../engines/goalsProgress.js";
import { commitmentToIncomeRatio } from "../../../engines/pressureAdvanced.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { formatInr, CHEVRON } from "../../../constants/symbols.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

/** One-line goal nudge — nearest active goal, links to Plan. */
export default function HomeGoalNudge() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { goals, commitments, settings, getEffectiveStatus } = usePerovo();
  const stable = useStabilityIntel();

  const nudge = useMemo(() => {
    const active = (goals || []).filter((g) => !g.archived);
    if (!active.length) return null;

    const sorted = [...active].sort((a, b) => {
      const da = a.targetDate || a.deadline || "9999-12-31";
      const db = b.targetDate || b.deadline || "9999-12-31";
      return da.localeCompare(db);
    });
    const goal = sorted[0];
    const income = combinedMonthlyIncome(settings);
    const openRemaining = commitments.reduce(
      (s, c) => s + Math.max(0, Number(c.remainingAmount ?? 0)),
      0,
    );
    const ratio = commitmentToIncomeRatio(commitments, income, getEffectiveStatus);
    const progress = Math.round(
      computeGoalProgress(goal, {
        openRemainingSum: openRemaining,
        burdenRatio: ratio,
        savedAmountTowardGoal:
          goal.type === "save_amount" || goal.type === "education" || goal.type === "wedding"
            ? Number(goal.savedAmount) || 0
            : 0,
      }) * 100,
    );
    const cap = stable.goalCapacity?.find((x) => x.id === goal.id);
    return {
      title: goal.title,
      progress,
      perMonth: cap?.neededPerMonth > 0 ? cap.neededPerMonth : null,
    };
  }, [goals, commitments, settings, getEffectiveStatus, stable.goalCapacity]);

  if (!nudge) return null;

  return (
    <button
      type="button"
      className="ct-home-goal-nudge ct-pressable ct-home-enter-item"
      style={{ animationDelay: "240ms" }}
      onClick={() => navigate("/plan")}
    >
      <CtIcon name="target" size={16} weight="duotone" aria-hidden />
      <span className="ct-home-goal-nudge-text">
        {nudge.perMonth
          ? t("home.goalNudge", {
              title: nudge.title,
              percent: nudge.progress,
              amount: formatInr(Math.round(nudge.perMonth)),
            })
          : t("home.goalNudgeShort", { title: nudge.title, percent: nudge.progress })}
      </span>
      <span className="text-[var(--ct-text-muted)] shrink-0" aria-hidden>
        {CHEVRON}
      </span>
    </button>
  );
}
