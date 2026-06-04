import { Card, InfoTip } from "../../index.js";
import { Heading, Caption } from "../../primitives/Text.jsx";
import { formatInr } from "../../../constants/symbols.js";
import { CALC_HELP } from "../../../constants/calculationHelp.js";

/**
 * @param {{ buckets: { label: string, count: number, amount: number }[], maxAmount: number }} props
 */
export function DueHeatmapCard({ buckets, maxAmount }) {
  return (
    <Card className="ct-stack">
      <Heading level={2} className="inline-flex items-center gap-1">
        Upcoming due dates (4 weeks)
        <InfoTip text={CALC_HELP.dueHeatmap} />
      </Heading>
      <Caption>Which weeks have the most bills due.</Caption>
      <div className="ct-grid-4">
        {buckets.map((b) => (
          <div key={b.label} className="ct-heat-col">
            <Caption className="mb-1">{b.label}</Caption>
            <div className="ct-heat-track">
              <div
                className="ct-heat-fill"
                style={{ height: `${Math.max(8, (b.amount / maxAmount) * 100)}%` }}
              />
            </div>
            <p className="ct-body-strong !text-xs mt-1">{b.count} due</p>
            <Caption>{formatInr(Math.round(b.amount))}</Caption>
          </div>
        ))}
      </div>
    </Card>
  );
}
