import { CALC_HELP } from "../../../constants/calculationHelp.js";
import { formatInr } from "../../../constants/symbols.js";
import { Card } from "../../primitives/Card.jsx";
import { InfoTip } from "../../primitives/InfoTip.jsx";
import { Badge } from "../../primitives/Badge.jsx";
import { MetricTile } from "../../patterns/MetricTile.jsx";
import { Heading, Body, Caption } from "../../primitives/Text.jsx";
import { Grid } from "../../primitives/Stack.jsx";

const SURVIVAL_COPY = {
  salaried: { title: "Salary survival", sub: "If paycheck stops today" },
  power: { title: "Runway", sub: "If income stops today" },
  freelancer: { title: "Income gap survival", sub: "Low-income months" },
  family: { title: "Household runway", sub: "If main income stops" },
};

export default function SurvivalCard({ survival, mode = "salaried" }) {
  if (!survival) return null;
  const copy = SURVIVAL_COPY[mode] || SURVIVAL_COPY.salaried;
  return (
    <Card variant="glow" className="ct-stack">
      <div className="ct-row-between items-start flex-wrap gap-2">
        <div>
          <Heading level={2} className="inline-flex items-center">
            {copy.title}
            <InfoTip text={CALC_HELP.survivalMonths} />
          </Heading>
          <Caption className="mt-0.5 block">{copy.sub}</Caption>
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
