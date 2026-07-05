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
  if (tone === "danger") return "var(--ed-red)";
  if (tone === "amber") return "var(--ed-amber)";
  return "var(--ed-green)";
}

function GoalProgressRing({ percent, tone = "teal", size = 40, className = "" }) {
  const pct = Math.min(100, Math.max(0, Number(percent) || 0));
  const deg = (pct / 100) * 360;
  const color = ringColor(tone);
  const inner = Math.round(size * 0.75);

  return (
    <div
      className={cn("ed-conic-ring shrink-0", className)}
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} 0deg ${deg}deg, rgba(255,255,255,0.08) ${deg}deg 360deg)`,
      }}
      aria-hidden
    >
      <div className="ed-conic-ring-inner" style={{ width: inner, height: inner }}>
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
export default function PlanGoalsSection({ requestOpen = false, variant = "full" }) {
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
      ? "var(--ed-green)"
      : behindCount > 0
        ? "var(--ed-red)"
        : onTrackCount < activeGoals.length
          ? "var(--ed-amber)"
          : "var(--ed-green)";

  const nearest = sorted[0];
  const topGoal = sorted.find((r) => r.intel.status === "behind") || nearest;

  const sheet = (
    <PlanToolSheet
      open={sheetOpen}
      onClose={() => setSheetOpen(false)}
      icon="target"
      title={t("home.goals")}
      accent="teal"
    >
      {renderPlanToolPanel("goals", { ...ctx, goalDraft })}
    </PlanToolSheet>
  );

  if (variant === "profile") {
    if (activeGoals.length === 0) {
      return (
        <>
          <div className="mt-2">
            <Caption className="block mb-2">{t("plan.goals.emptyQuestion")}</Caption>
            <div className="ed-row-wrap gap-1">
              {SUGGESTED_GOALS.map((s) => (
                <button
                  key={s.titleKey}
                  type="button"
                  className="ed-chip"
                  onClick={() => openGoals({ type: s.type, title: t(s.titleKey) })}
                >
                  {t(s.titleKey)}
                </button>
              ))}
            </div>
            <Button type="button" size="sm" className="mt-2" onClick={() => openGoals()}>
              {t("plan.goals.setFirst")}
            </Button>
          </div>
          {sheet}
        </>
      );
    }

    const { goal, intel, cap, monthsLeft } = topGoal;
    return (
      <>
        <button
          type="button"
          className="ed-plan-goal-card mt-2"
          onClick={() => openGoals()}
          aria-label={t("plan.goals.cardAria", { title: goal.title, pct: intel.progressPercent })}
        >
          <div className="flex items-center gap-3">
            <GoalProgressRing percent={intel.progressPercent} tone={ringTone(intel.status)} size={36} />
            <div className="min-w-0 flex-1">
              <Body className="font-semibold truncate block">{goal.title}</Body>
              <Caption className="block">{t(goalTypeI18nKey(goal.type))}</Caption>
              {cap?.neededPerMonth > 0 ? (
                <Caption className="block">{formatInr(cap.neededPerMonth)}/mo</Caption>
              ) : null}
            </div>
            <div className="text-right shrink-0">
              <Body className="font-semibold" style={{ color: "var(--ed-green)" }}>
                {intel.progressPercent}%
              </Body>
              {monthsLeft != null ? (
                <Caption className="block">{t("plan.goals.monthsLeft", { count: monthsLeft })}</Caption>
              ) : null}
            </div>
          </div>
        </button>
        {sheet}
      </>
    );
  }

  if (activeGoals.length === 0) {
    return (
      <section className="ed-section">
        <div className="ed-inset-green">
          <Body className="font-semibold">{t("plan.goals.emptyQuestion")}</Body>
          <div className="ed-row-wrap gap-2 mt-3">
            {SUGGESTED_GOALS.map((s) => (
              <button
                key={s.titleKey}
                type="button"
                className="ed-chip"
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
        {sheet}
      </section>
    );
  }

  return (
    <section className="ed-section">
      <div className="ed-inset">
<p className="ed-field-label">{t("plan.goals.heroLabel")}</p>
        <p className="ed-hero-number" style={{ color: heroColor, fontSize: "20px" }}>
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

      <div className="ed-stack-sm">
        {sorted.slice(0, 3).map(({ goal, intel, cap, monthsLeft }) => (
          <button
            key={goal.id}
            type="button"
            className="ed-inset ed-plan-goal-card"
            onClick={() => openGoals()}
            aria-label={t("plan.goals.cardAria", {
              title: goal.title,
              pct: intel.progressPercent,
            })}
          >
            <div className="flex items-center gap-3">
              <GoalProgressRing percent={intel.progressPercent} tone={ringTone(intel.status)} />
              <div className="min-w-0 flex-1 text-left">
                <Body className="font-semibold truncate block">{goal.title}</Body>
                <Caption className="block">{t(goalTypeI18nKey(goal.type))}</Caption>
                {cap?.neededPerMonth > 0 ? (
                  <Caption className="block">{formatInr(cap.neededPerMonth)}/mo</Caption>
                ) : null}
              </div>
              <div className="text-right shrink-0">
                <Body className="font-semibold" style={{ color: "var(--ed-green)" }}>
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
        <button type="button" className="ed-plan-see-all" onClick={() => openGoals()}>
          {t("plan.goals.seeAll", { count: activeGoals.length })} {CHEVRON}
        </button>
      ) : null}

      <Button type="button" variant="outline" className="w-full" onClick={() => openGoals()}>
        {t("plan.goals.addGoal")}
      </Button>

      {sheet}
    </section>
  );
}
