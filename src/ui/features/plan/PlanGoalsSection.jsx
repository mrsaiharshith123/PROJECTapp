import { useMemo, useState } from "react";
import { differenceInCalendarMonths, parseISO } from "date-fns";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { computeGoalIntel } from "../../../engines/goalsProgress.js";
import { monthlyBurdenForCommitment } from "../../../engines/burden.js";
import { formatInr, CHEVRON } from "../../../constants/symbols.js";
import { Button, Caption, Body } from "../../index.js";
import { cn } from "../../utils/cn.js";
import PlanToolSheet from "./PlanToolSheet.jsx";
import { renderPlanToolPanel } from "./planToolPanels.jsx";

const SUGGESTED_GOALS = [
  { type: "save_amount", titleKey: "plan.goals.suggestEmergency" },
  { type: "save_amount", titleKey: "plan.goals.suggestTrip" },
  { type: "save_amount", titleKey: "plan.goals.suggestDownPayment" },
];

function ringColor(tone) {
  if (tone === "danger") return "var(--ct-danger)";
  if (tone === "amber") return "var(--ct-warning)";
  return "var(--ct-success)";
}

function GoalProgressRing({ percent, tone = "teal", size = 40, className = "" }) {
  const pct = Math.min(100, Math.max(0, Number(percent) || 0));
  const deg = (pct / 100) * 360;
  const color = ringColor(tone);
  const inner = Math.round(size * 0.75);

  return (
    <div
      className={cn("ct-conic-ring shrink-0", className)}
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} 0deg ${deg}deg, rgba(255,255,255,0.08) ${deg}deg 360deg)`,
      }}
      aria-hidden
    >
      <div className="ct-conic-ring-inner" style={{ width: inner, height: inner }}>
        <span className="text-[10px] font-semibold tabular-nums" style={{ color }}>
          {Math.round(pct)}
        </span>
      </div>
    </div>
  );
}

/** @param {string} type */
function goalTypeI18nKey(type) {
  const map = {
    reduce_open_debt: "reduceOpenDebt",
    income_ratio_cap: "incomeRatioCap",
    save_amount: "saveAmount",
    education: "education",
    wedding: "wedding",
  };
  return `goals.type.${map[type] || "saveAmount"}`;
}

function ringTone(status) {
  if (status === "behind") return "danger";
  if (status === "slow") return "amber";
  return "teal";
}

/** Goals hero + cards — top of Plan tab. */
export default function PlanGoalsSection({ requestOpen = false }) {
  const { t } = useTranslation();
  const ctx = usePerovo();
  const { goals, commitments, getEffectiveStatus, todayStr } = ctx;
  const stable = useStabilityIntel();
  const intel = useCommitIntel();
  const [sheetOpen, setSheetOpen] = useState(() => requestOpen);
  const [goalDraft, setGoalDraft] = useState(/** @type {{ title?: string, type?: string } | null} */ (null));

  const openGoals = (draft = null) => {
    setGoalDraft(draft);
    setSheetOpen(true);
  };

  const openRemaining = useMemo(
    () => commitments.reduce((s, c) => s + monthlyBurdenForCommitment(c, getEffectiveStatus), 0),
    [commitments, getEffectiveStatus],
  );

  const activeGoals = useMemo(() => goals.filter((g) => !g.archived), [goals]);

  const enriched = useMemo(
    () =>
      activeGoals.map((g) => {
        const saved =
          g.type === "save_amount" || g.type === "education" || g.type === "wedding"
            ? Number(g.savedAmount) || 0
            : 0;
        const intelRow = computeGoalIntel(
          g,
          {
            openRemainingSum: openRemaining,
            burdenRatio: intel.burdenRatio,
            savedAmountTowardGoal: saved,
          },
          todayStr,
        );
        const cap = stable.goalCapacity?.find((x) => x.id === g.id);
        let monthsLeft = null;
        if (g.targetDate && todayStr) {
          try {
            monthsLeft = Math.max(
              0,
              differenceInCalendarMonths(
                parseISO(`${g.targetDate}T12:00:00`),
                parseISO(`${todayStr}T12:00:00`),
              ),
            );
          } catch {
            monthsLeft = null;
          }
        }
        return { goal: g, intel: intelRow, cap, monthsLeft };
      }),
    [activeGoals, openRemaining, intel.burdenRatio, stable.goalCapacity, todayStr],
  );

  const sorted = useMemo(() => {
    const copy = [...enriched];
    copy.sort((a, b) => {
      const da = a.goal.targetDate || "9999-12-31";
      const db = b.goal.targetDate || "9999-12-31";
      return da.localeCompare(db);
    });
    return copy;
  }, [enriched]);

  const onTrackCount = enriched.filter((r) => r.intel.status === "on_track" || r.intel.status === "near_complete" || r.intel.status === "complete").length;
  const behindCount = enriched.filter((r) => r.intel.status === "behind").length;
  const heroColor =
    activeGoals.length === 0
      ? "#2dd4bf"
      : behindCount > 0
        ? "#f87171"
        : onTrackCount < activeGoals.length
          ? "#fbbf24"
          : "#2dd4bf";

  const nearest = sorted[0];

  if (activeGoals.length === 0) {
    return (
      <section className="ct-plan-section">
        <div className="ct-stat-tile teal ct-plan-goals-empty">
          <Body className="font-semibold">{t("plan.goals.emptyQuestion")}</Body>
          <div className="ct-row-wrap gap-2 mt-3">
            {SUGGESTED_GOALS.map((s) => (
              <button
                key={s.titleKey}
                type="button"
                className="ct-chip"
                onClick={() => openGoals({ type: s.type, title: t(s.titleKey) })}
              >
                {t(s.titleKey)}
              </button>
            ))}
          </div>
          <Button type="button" className="mt-4" onClick={() => openGoals()}>
            {t("plan.goals.setFirst")}
          </Button>
        </div>
        <PlanToolSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          icon="target"
          title={t("home.goals")}
          accent="teal"
        >
          {renderPlanToolPanel("goals", { ...ctx, goalDraft })}
        </PlanToolSheet>
      </section>
    );
  }

  return (
    <section className="ct-plan-section">
      <div className="ct-hero-card wealth ct-plan-goals-hero">
        <div className="ct-hero-glow teal" aria-hidden />
        <p className="ct-hero-label">{t("plan.goals.heroLabel")}</p>
        <p className="ct-hero-number" style={{ color: heroColor, fontSize: "20px" }}>
          {t("plan.goals.onTrackSummary", { onTrack: onTrackCount, total: activeGoals.length })}
        </p>
        {nearest ? (
          <Caption className="block mt-1">
            {t("plan.goals.nearestLine", {
              title: nearest.goal.title,
              pct: nearest.intel.progressPercent,
              months: nearest.monthsLeft ?? "—",
            })}
          </Caption>
        ) : null}
      </div>

      <div className="ct-stack-sm">
        {sorted.slice(0, 3).map(({ goal, intel, cap, monthsLeft }) => (
          <button
            key={goal.id}
            type="button"
            className="ct-stat-tile ct-plan-goal-card ct-pressable"
            onClick={() => openGoals()}
            aria-label={t("plan.goals.cardAria", {
              title: goal.title,
              pct: intel.progressPercent,
            })}
          >
            <div className="ct-row gap-3 items-center">
              <GoalProgressRing percent={intel.progressPercent} tone={ringTone(intel.status)} />
              <div className="min-w-0 flex-1 text-left">
                <Body className="font-semibold truncate block">{goal.title}</Body>
                <Caption className="block">{t(goalTypeI18nKey(goal.type))}</Caption>
                {cap?.neededPerMonth > 0 ? (
                  <Caption className="block">{formatInr(cap.neededPerMonth)}/mo</Caption>
                ) : null}
              </div>
              <div className="text-right shrink-0">
                <Body className="font-semibold" style={{ color: "#2dd4bf" }}>
                  {intel.progressPercent}%
                </Body>
                {monthsLeft != null ? (
                  <Caption className="block">{t("plan.goals.monthsLeft", { count: monthsLeft })}</Caption>
                ) : null}
              </div>
            </div>
          </button>
        ))}
      </div>

      {activeGoals.length > 3 ? (
        <button type="button" className="ct-plan-see-all" onClick={() => openGoals()}>
          {t("plan.goals.seeAll", { count: activeGoals.length })} {CHEVRON}
        </button>
      ) : null}

      <Button type="button" variant="outline" className="w-full" onClick={() => openGoals()}>
        {t("plan.goals.addGoal")}
      </Button>

      <PlanToolSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        icon="target"
        title={t("home.goals")}
        accent="teal"
      >
        {renderPlanToolPanel("goals", { ...ctx, goalDraft })}
      </PlanToolSheet>
    </section>
  );
}
