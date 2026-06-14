import { differenceInCalendarDays, parseISO } from "date-fns";
import { CALC_HELP } from "../../../constants/calculationHelp.js";
import { formatInr } from "../../../constants/symbols.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { computeHouseholdMetrics, computeFamilyEmergencyTarget } from "../../../engines/householdEntity.js";
import { computeFamilyPressure } from "../../../engines/modeFamily.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { Card } from "../../primitives/Card.jsx";
import { InfoTip } from "../../primitives/InfoTip.jsx";
import { Badge } from "../../primitives/Badge.jsx";
import { MetricTile } from "../../patterns/MetricTile.jsx";
import { Heading, Body, Caption } from "../../primitives/Text.jsx";
import { Grid, Stack } from "../../primitives/Stack.jsx";
import { ProgressBar } from "../../patterns/ProgressBar.jsx";
import ModeHeroCard from "./shared/ModeHeroCard.jsx";
import ModeInsightStrip from "./shared/ModeInsightStrip.jsx";
import FestivalPlannerCard from "./FestivalPlannerCard.jsx";
import SchoolFeeCard from "./SchoolFeeCard.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";

function HouseholdRunwayCard({ survival }) {
  const { t } = useTranslation();
  if (!survival) return null;
  return (
    <Card variant="glow" className="ct-stack">
      <div className="ct-row-between items-start flex-wrap gap-2">
        <div>
          <Heading level={2} className="inline-flex items-center">
            {t("family.dashboard.householdRunway")}
            <InfoTip text={CALC_HELP.survivalMonths} />
          </Heading>
          <Caption className="mt-0.5 block">{t("family.dashboard.ifIncomeStops")}</Caption>
        </div>
        <Badge tone={survival.tone}>{survival.tierLabel}</Badge>
      </div>
      <Body>{survival.headline}</Body>
      <Grid cols={2}>
        <MetricTile label={t("family.dashboard.monthlyBurn")} value={formatInr(survival.monthlyBurn)} />
        <MetricTile label={t("family.dashboard.householdReserve")} value={formatInr(survival.liquidSavings)} />
      </Grid>
    </Card>
  );
}

/** Household / family experience — shared expenses, education, renewals. */
export default function FamilyModeDashboard() {
  const { t } = useTranslation();
  const { settings, commitments, getEffectiveStatus, todayStr } = useCommitTrack();
  const stable = useStabilityIntel();
  const intel = useCommitIntel();
  const family = stable.family;
  const household = computeHouseholdMetrics({
    settings,
    commitments,
    getEffectiveStatus,
    todayStr,
  });

  if (!family) return <HouseholdRunwayCard survival={stable.survival} />;

  const income = combinedMonthlyIncome(settings);
  const familyPressure = computeFamilyPressure(
    commitments,
    income,
    getEffectiveStatus,
    Number(settings.dependents || 0),
  );
  const emergencyTarget = computeFamilyEmergencyTarget(settings, commitments, getEffectiveStatus);
  const liquidSavings = Math.max(0, Number(settings.liquidSavings) || 0);
  const emergencyPct =
    emergencyTarget.targetAmount > 0
      ? Math.min(100, Math.round((liquidSavings / emergencyTarget.targetAmount) * 100))
      : 0;

  const free = intel.stability?.freeMoney ?? 0;
  const pressureScore = familyPressure.familyPressureScore ?? 0;

  const heroMetrics = [
    {
      label: t("family.dashboard.householdBurden"),
      value: formatInr(family.householdBurden),
      sub:
        family.committedPercent != null
          ? t("family.dashboard.percentIncome", { percent: family.committedPercent })
          : "",
      tone: family.committedPercent > 65 ? "warn" : "default",
    },
    {
      label: t("family.dashboard.householdPressure"),
      value: `${Math.round(pressureScore)}/100`,
      sub:
        pressureScore > 70
          ? t("family.dashboard.pressureHigh")
          : pressureScore > 45
            ? t("family.dashboard.pressureModerate")
            : t("family.dashboard.pressureHealthy"),
      tone: pressureScore > 70 ? "warn" : pressureScore > 45 ? "default" : "good",
    },
    {
      label: t("family.dashboard.schoolFeesOpen"),
      value: formatInr(family.schoolOpen),
      tone: family.schoolOpen > 0 ? "warn" : "good",
    },
    {
      label: t("family.dashboard.sharedFreeCash"),
      value: formatInr(free),
      tone: free >= 0 ? "good" : "warn",
    },
  ];

  const topGroups = Object.entries(family.grouped || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const renewalsTotal = (family.heavyRenewals || []).reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
    <Stack gap="md">
      <ModeHeroCard
        icon="users-three"
        title={t("family.dashboard.title")}
        subtitle={
          settings.activeProfileId && settings.activeProfileId !== "default"
            ? t("family.dashboard.profileActive", { id: settings.activeProfileId })
            : t("family.dashboard.subtitleShared")
        }
        metrics={heroMetrics}
        tip={t("family.dashboard.tip")}
      />

      <SchoolFeeCard />
      <FestivalPlannerCard />

      <Card variant="flat" className="ct-stack">
        <div className="ct-row-between">
          <Caption>{t("family.emergency.fundTitle")}</Caption>
          <Badge tone={emergencyPct >= 100 ? "success" : emergencyPct >= 50 ? "warning" : "danger"}>
            {t("family.emergency.fundedPct", { pct: emergencyPct })}
          </Badge>
        </div>
        <ProgressBar value={emergencyPct} />
        <Caption className="block">
          {t("family.emergency.targetLine", {
            target: formatInr(emergencyTarget.targetAmount),
            months: emergencyTarget.targetMonths,
            saved: formatInr(liquidSavings),
          })}
        </Caption>
        <Caption className="block ct-text-muted">{emergencyTarget.reasoning}</Caption>
      </Card>

      <Grid cols={2}>
        <MetricTile label={t("family.dashboard.educationPressure")} value={formatInr(family.schoolOpen)} />
        <MetricTile label={t("family.dashboard.renewalsTracked")} value={String((family.heavyRenewals || []).length)} />
        <MetricTile label={t("family.dashboard.dependents")} value={String(settings.dependents || 0)} />
      </Grid>

      <Card variant="flat" className="ct-stack">
        <Heading level={3}>{t("family.dashboard.householdEntity")}</Heading>
        <Caption className="block">
          {t("family.dashboard.entitySummary", {
            count: household.memberCount,
            income: formatInr(household.combinedIncome),
            burden: household.burdenRatio != null ? `${household.burdenRatio}%` : "—",
          })}
        </Caption>
        <div className="ct-row-between">
          <Caption>{t("family.dashboard.sharedFreeCash")}</Caption>
          <Body className="font-semibold ct-numeral">{formatInr(household.combinedFreeCash)}</Body>
        </div>
        <Badge tone={household.stabilityLabel === "stable" ? "success" : household.stabilityLabel === "tight" ? "warning" : "danger"}>
          {household.stabilityLabel}
        </Badge>
        {household.members.map((m) => (
          <Caption key={m.id} className="block">
            {m.label} · {m.role}
          </Caption>
        ))}
      </Card>

      {topGroups.length > 0 && (
        <Card variant="flat" className="ct-stack">
          <Heading level={3}>{t("family.dashboard.sharedGroups")}</Heading>
          {topGroups.map(([cat, amt]) => (
            <div key={cat} className="ct-row-between">
              <Caption>{cat}</Caption>
              <Body className="font-semibold ct-numeral">{formatInr(amt)}</Body>
            </div>
          ))}
        </Card>
      )}

      {family.heavyRenewals?.length > 0 && (
        <Card variant="flat" className="ct-stack">
          <Heading level={3}>{t("family.renewals.timelineTitle")}</Heading>
          <Caption className="block">{t("family.renewals.timelineHint")}</Caption>
          {family.heavyRenewals.slice(0, 6).map((r, i) => (
            <div
              key={`${r.name}-${r.dueDate}-${i}`}
              className="ct-row-between gap-2 py-1"
              style={{ borderBottom: "0.5px solid var(--ct-border)" }}
            >
              <div className="min-w-0 flex-1">
                <Body className="font-semibold truncate">{r.name}</Body>
                <Caption>
                  {r.category} · {t("family.renewals.due", { date: r.dueDate || t("family.renewals.tbd") })}
                </Caption>
              </div>
              <div className="text-right shrink-0">
                <Body className="font-semibold ct-numeral">{formatInr(r.amount)}</Body>
                {r.dueDate && (
                  <Caption className={differenceInCalendarDays(parseISO(r.dueDate), parseISO(todayStr)) < 30 ? "text-orange-400" : ""}>
                    {t("family.renewals.inDays", {
                      days: Math.max(0, differenceInCalendarDays(parseISO(r.dueDate), parseISO(todayStr))),
                    })}
                  </Caption>
                )}
              </div>
            </div>
          ))}
          <Caption className="block ct-text-muted mt-1">
            {t("family.renewals.totalYear", { amount: formatInr(renewalsTotal) })}
          </Caption>
        </Card>
      )}

      <ModeInsightStrip insights={family.insights} />
      <HouseholdRunwayCard survival={stable.survival} />
    </Stack>
  );
}
