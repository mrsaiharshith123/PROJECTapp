import { differenceInCalendarDays, parseISO } from "date-fns";
import { CALC_HELP } from "../../../constants/calculationHelp.js";
import { formatInr } from "../../../constants/symbols.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { computeHouseholdMetrics, computeFamilyEmergencyTarget } from "../../../engines/householdEntity.js";
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
import SchoolFeeCard from "./SchoolFeeCard.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import RoomActivityFeed from "../household/RoomActivityFeed.jsx";
import SharedGoalCard from "../household/SharedGoalCard.jsx";
import FamilyMonthlyReportCard from "../household/FamilyMonthlyReportCard.jsx";
import { useCountUp } from "../../hooks/useCountUp.js";
import { MetricOwnerLink } from "../../patterns/MetricOwnerLink.jsx";

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
  const { settings, commitments, getEffectiveStatus, todayStr, allGoals } = usePerovo();
  const stable = useStabilityIntel();
  const intel = useCommitIntel();
  const family = stable.family;
  const household = computeHouseholdMetrics({
    settings,
    commitments,
    getEffectiveStatus,
    todayStr,
  });

  const free = intel.stability?.freeMoney ?? 0;
  const countedFree = useCountUp(Math.max(0, Math.round(free)), 900);
  const countedBurden = useCountUp(Math.max(0, Math.round(family?.householdBurden ?? 0)), 900);
  const countedIncome = useCountUp(Math.max(0, Math.round(household.combinedIncome ?? 0)), 900);

  if (!family) return <HouseholdRunwayCard survival={stable.survival} />;

  const pressureScore = intel.stability?.score ?? 0;
  const runwayMonths = stable.survival?.survivalMonths ?? 0;

  const emergencyTarget = computeFamilyEmergencyTarget(settings, commitments, getEffectiveStatus);
  const liquidSavings = Math.max(0, Number(settings.liquidSavings) || 0);
  const emergencyPct =
    emergencyTarget.targetAmount > 0
      ? Math.min(100, Math.round((liquidSavings / emergencyTarget.targetAmount) * 100))
      : 0;

  const heroMetrics = [
    {
      label: t("family.dashboard.sharedFreeCash"),
      value: formatInr(countedFree),
      tone: free >= 0 ? "good" : "warn",
    },
    {
      label: t("family.dashboard.householdBurden"),
      value: formatInr(countedBurden),
      sub:
        family.committedPercent != null
          ? t("family.dashboard.percentIncome", { percent: family.committedPercent })
          : "",
      tone: family.committedPercent > 65 ? "warn" : "default",
    },
    {
      label: t("family.dashboard.schoolFeesOpen"),
      value: formatInr(family.schoolOpen),
      tone: family.schoolOpen > 0 ? "warn" : "good",
    },
  ];

  const topGroups = Object.entries(family.grouped || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const renewalsTotal = (family.heavyRenewals || []).reduce((s, r) => s + Number(r.amount || 0), 0);
  const sharedGoals = (allGoals || []).filter((g) => !g.archived && g.forMember === "shared");

  return (
    <Stack gap="md">
      <div className="ct-animate-fade-up" style={{ animationDelay: "0ms" }}>
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
      </div>

      <div className="ct-hero-card survival ct-household-outlook-card ct-animate-fade-up" style={{ animationDelay: "40ms" }}>
        <div className="ct-hero-glow amber" aria-hidden />
        <Heading level={3} className="!text-base relative">{t("family.dashboard.outlook")}</Heading>
        <div className="ct-stack mt-3 relative">
          <MetricOwnerLink label={t("pulse.pressure")} value={String(pressureScore)} to="/" />
          <MetricOwnerLink
            label={t("family.dashboard.householdRunway")}
            value={t("netWorth.liquidity.months", { count: runwayMonths })}
            to="/insights"
          />
          <div className="ct-stat-tile teal">
            <p className="ct-stat-label">{t("family.emergency.fundTitle")}</p>
            <p className="ct-stat-value">{emergencyPct}%</p>
          </div>
        </div>
      </div>

      <div className="ct-animate-fade-up" style={{ animationDelay: "60ms" }}>
        <SchoolFeeCard />
      </div>

      <Card variant="flat" className="ct-stack ct-animate-fade-up" style={{ animationDelay: "120ms" }}>
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
        <Caption className="block ct-text-muted">
          {emergencyTarget.reasoning}
        </Caption>
      </Card>

      <div className="ct-animate-fade-up" style={{ animationDelay: "240ms" }}>
        <Grid cols={2}>
        <MetricTile label={t("family.dashboard.educationPressure")} value={formatInr(family.schoolOpen)} />
        <MetricTile label={t("family.dashboard.renewalsTracked")} value={String((family.heavyRenewals || []).length)} />
        <MetricTile label={t("family.dashboard.dependents")} value={String(settings.dependents || 0)} />
        </Grid>
      </div>

      <Card variant="flat" className="ct-stack">
        <Heading level={3}>{t("family.dashboard.householdEntity")}</Heading>
        <Caption className="block">
          {t("family.dashboard.entitySummary", {
            count: household.memberCount,
            income: formatInr(countedIncome),
            burden: household.burdenRatio != null ? `${household.burdenRatio}%` : "—",
          })}
        </Caption>
        <div className="ct-row-between">
          <Caption>{t("family.dashboard.sharedFreeCash")}</Caption>
          <Body className="font-semibold ct-numeral">{formatInr(countedFree)}</Body>
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
      {sharedGoals.length > 0 ? (
        <Card variant="flat" className="ct-stack">
          <Heading level={3}>{t("goals.shared.sectionTitle")}</Heading>
          {sharedGoals.map((g) => (
            <SharedGoalCard key={g.id} goal={g} settings={settings} />
          ))}
        </Card>
      ) : null}
      {settings.householdRoomId ? (
        <div className="ct-animate-fade-up" style={{ animationDelay: "240ms" }}>
          <RoomActivityFeed roomId={settings.householdRoomId} />
        </div>
      ) : null}
      <FamilyMonthlyReportCard />
    </Stack>
  );
}
