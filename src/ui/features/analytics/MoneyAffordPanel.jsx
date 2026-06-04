import { Card, InfoTip } from "../../index.js";
import { Caption, Eyebrow } from "../../primitives/Text.jsx";
import { cn } from "../../utils/cn.js";

/**
 * @param {{
 *   title: string,
 *   hint?: string,
 *   rows: { label: string, value: string, tone?: string, sub?: import('react').ReactNode, tip?: string }[],
 * }} props
 */
export function MoneyAffordPanel({ title, hint, rows }) {
  return (
    <Card variant="hero" className={cn("ct-card-hero-deep", "ct-stack")}>
      <div>
        <Eyebrow>{title}</Eyebrow>
        {hint ? <Caption className="mt-0.5">{hint}</Caption> : null}
      </div>
      <div className="ct-grid-3">
        {rows.map((r) => (
          <div key={r.label}>
            <Caption className="inline-flex items-center gap-0.5 mb-1">
              {r.label}
              {r.tip ? <InfoTip text={r.tip} /> : null}
            </Caption>
            <p
              className={cn(
                "ct-display text-xl",
                r.tone === "warn" && "ct-hero-metric-warn",
                r.tone === "success" && "ct-hero-metric-success"
              )}
            >
              {r.value}
            </p>
            {r.sub ? <Caption className="mt-0.5 inline-flex items-center gap-0.5">{r.sub}</Caption> : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
