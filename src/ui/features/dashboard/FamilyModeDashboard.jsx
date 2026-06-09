import { CALC_HELP } from "../../../constants/calculationHelp.js";
import { formatInr } from "../../../constants/symbols.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { computeHouseholdMetrics } from "../../../engines/householdEntity.js";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { Card } from "../../primitives/Card.jsx";
import { InfoTip } from "../../primitives/InfoTip.jsx";
import { Badge } from "../../primitives/Badge.jsx";
import { MetricTile } from "../../patterns/MetricTile.jsx";
import { Heading, Body, Caption } from "../../primitives/Text.jsx";
import { Grid, Stack } from "../../primitives/Stack.jsx";
import { StatCard } from "../../patterns/StatCard.jsx";
import ModeHeroCard from "./shared/ModeHeroCard.jsx";
import ModeInsightStrip from "./shared/ModeInsightStrip.jsx";
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

  const free = intel.stability?.freeMoney ?? 0;
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
      label: t("family.dashboard.schoolFeesOpen"),
      value: formatInr(family.schoolOpen),
      tone: family.schoolOpen > 0 ? "warn" : "good",
    },
    {
      label: t("family.dashboard.householdSafety"),
      value: family.safetyLabel,
      sub:
        family.committedPercent != null
          ? t("family.dashboard.percentIncome", { percent: family.committedPercent })
          : "",
      tone: family.safetyLabel === "Comfortable" || family.safetyLabel === "Moderate" ? "good" : "warn",
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

      <Grid cols={2}>
        <StatCard label={t("family.dashboard.educationPressure")} value={formatInr(family.schoolOpen)} />
        <StatCard label={t("family.dashboard.renewalsTracked")} value={String((family.heavyRenewals || []).length)} />
        <StatCard label={t("family.dashboard.emergencyReadiness")} value={stable.emergency?.label || "—"} />
        <StatCard label={t("family.dashboard.dependents")} value={String(settings.dependents || 0)} />
      </Grid>

      <Card variant="flat" className="ct-stack">
        <Heading level={3}>Household entity</Heading>
        <Caption className="block">
          {household.memberCount} members · combined income {formatInr(household.combinedIncome)} · burden{" "}
          {household.burdenRatio != null ? `${household.burdenRatio}%` : "—"}
        </Caption>
        <div className="ct-row-between">
          <Caption>Shared free cash</Caption>
          <Body className="font-semibold">{formatInr(household.combinedFreeCash)}</Body>
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
              <Body className="font-semibold">{formatInr(amt)}</Body>
            </div>
          ))}
        </Card>
      )}

      {family.heavyRenewals?.length > 0 && (
        <Card variant="flat" className="ct-stack">
          <Heading level={3}>{t("family.dashboard.upcomingRenewals")}</Heading>
          {family.heavyRenewals.slice(0, 5).map((r) => (
            <div key={`${r.name}-${r.dueDate}`} className="ct-row-between gap-2 flex-wrap">
              <div className="min-w-0">
                <Body className="font-semibold truncate">{r.name}</Body>
                <Caption>
                  {r.category} · {r.dueDate || "—"}
                </Caption>
              </div>
              <span className="ct-metric-value shrink-0">{formatInr(r.amount)}</span>
            </div>
          ))}
        </Card>
      )}

      <ModeInsightStrip insights={family.insights} />
      <HouseholdRunwayCard survival={stable.survival} />
    </Stack>
  );
}
