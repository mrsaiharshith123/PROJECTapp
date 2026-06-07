import { CALC_HELP } from "../../../constants/calculationHelp.js";
import { formatInr } from "../../../constants/symbols.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
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

function HouseholdRunwayCard({ survival }) {
  if (!survival) return null;
  return (
    <Card variant="glow" className="ct-stack">
      <div className="ct-row-between items-start flex-wrap gap-2">
        <div>
          <Heading level={2} className="inline-flex items-center">
            Household runway
            <InfoTip text={CALC_HELP.survivalMonths} />
          </Heading>
          <Caption className="mt-0.5 block">If main household income stops</Caption>
        </div>
        <Badge className={survival.badgeClass}>{survival.tierLabel}</Badge>
      </div>
      <Body>{survival.headline}</Body>
      <Grid cols={2}>
        <MetricTile label="Monthly burn" value={formatInr(survival.monthlyBurn)} />
        <MetricTile label="Household reserve" value={formatInr(survival.liquidSavings)} />
      </Grid>
    </Card>
  );
}

/** Household / family experience — shared expenses, education, renewals. */
export default function FamilyModeDashboard() {
  const { settings } = useCommitTrack();
  const stable = useStabilityIntel();
  const intel = useCommitIntel();
  const family = stable.family;

  if (!family) return <HouseholdRunwayCard survival={stable.survival} />;

  const free = intel.stability?.freeMoney ?? 0;
  const heroMetrics = [
    {
      label: "Household burden",
      value: formatInr(family.householdBurden),
      sub: family.committedPercent != null ? `${family.committedPercent}% of income` : "",
      tone: family.committedPercent > 65 ? "warn" : "default",
    },
    {
      label: "School fees open",
      value: formatInr(family.schoolOpen),
      tone: family.schoolOpen > 0 ? "warn" : "good",
    },
    {
      label: "Household safety",
      value: `${family.familyPressureScore}%`,
      sub: family.safetyLabel,
      tone: family.familyPressureScore >= 70 ? "good" : "warn",
    },
    {
      label: "Shared free cash",
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
        title="Household finances"
        subtitle={
          settings.activeProfileId && settings.activeProfileId !== "default"
            ? `Profile: ${settings.activeProfileId}`
            : "Shared commitments & future pressure"
        }
        metrics={heroMetrics}
        tip="Use Bills for school, insurance, and rent — calendar highlights heavy renewal months."
      />

      <Grid cols={2}>
        <StatCard label="Education pressure" value={formatInr(family.schoolOpen)} />
        <StatCard label="Renewals tracked" value={String((family.heavyRenewals || []).length)} />
        <StatCard label="Emergency readiness" value={stable.emergency?.label || "—"} />
        <StatCard label="Dependents" value={String(settings.dependents || 0)} />
      </Grid>

      {topGroups.length > 0 && (
        <Card variant="flat" className="ct-stack">
          <Heading level={3}>Shared expense groups</Heading>
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
          <Heading level={3}>Upcoming renewals</Heading>
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
