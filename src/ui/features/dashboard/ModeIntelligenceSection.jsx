import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { getExperienceMode } from "../../../constants/modeExperience.js";
import { CALC_HELP } from "../../../constants/calculationHelp.js";
import { formatInr } from "../../../constants/symbols.js";
import { Card } from "../../primitives/Card.jsx";
import { InfoTip } from "../../primitives/InfoTip.jsx";
import { Badge } from "../../primitives/Badge.jsx";
import { MetricTile } from "../../patterns/MetricTile.jsx";
import { Heading, Body, Caption } from "../../primitives/Text.jsx";
import { Grid, Stack } from "../../primitives/Stack.jsx";
import FamilyModeDashboard from "./FamilyModeDashboard.jsx";

const SURVIVAL_COPY = {
  salaried: { title: "Salary survival", sub: "If paycheck stops today" },
  power: { title: "Runway", sub: "If income stops today" },
};

function SalariedSurvivalPanel({ mode = "salaried" }) {
  const stable = useStabilityIntel();
  const survival = stable.survival;
  if (!survival) return null;
  const labels = SURVIVAL_COPY[mode] || SURVIVAL_COPY.salaried;

  return (
    <Card variant="glow" className="ct-stack">
      <div className="ct-row-between items-start flex-wrap gap-2">
        <div>
          <Heading level={2} className="inline-flex items-center">
            {labels.title}
            <InfoTip text={CALC_HELP.survivalMonths} />
          </Heading>
          <Caption className="mt-0.5 block">{labels.sub}</Caption>
        </div>
        <Badge className={survival.badgeClass}>{survival.tierLabel}</Badge>
      </div>
      <Body>{survival.headline}</Body>
      <Grid cols={2}>
        <MetricTile label="Monthly burn" value={formatInr(survival.monthlyBurn)} />
        <MetricTile label="Liquid savings" value={formatInr(survival.liquidSavings)} />
      </Grid>
    </Card>
  );
}

/** Mode-specific home intelligence — salaried or household. */
export default function ModeIntelligenceSection() {
  const { settings } = useCommitTrack();
  const stable = useStabilityIntel();
  const mode = stable.mode || getExperienceMode(settings);

  return (
    <Stack gap="md">
      {mode === "family" && <FamilyModeDashboard />}
      {(mode === "salaried" || mode === "power") && <SalariedSurvivalPanel mode={mode} />}
    </Stack>
  );
}
