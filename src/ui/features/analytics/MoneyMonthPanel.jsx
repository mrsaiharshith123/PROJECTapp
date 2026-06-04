import { Card, InfoTip } from "../../index.js";
import { Caption, Eyebrow } from "../../primitives/Text.jsx";
import { cn } from "../../utils/cn.js";

/**
 * @param {{
 *   title: string,
 *   monthLabel: string,
 *   hint?: string,
 *   metrics: { label: string, value: string, tone?: string, tip?: string }[],
 *   footer?: string,
 *   children?: import('react').ReactNode,
 * }} props
 */
export function MoneyMonthPanel({ title, monthLabel, hint, metrics, footer, children }) {
  return (
    <Card variant="hero" className="ct-stack">
      <div>
        <Eyebrow>{title}</Eyebrow>
        <Caption className="mt-0.5">{monthLabel}</Caption>
        {hint ? <Caption className="mt-0.5">{hint}</Caption> : null}
      </div>
      <div className="ct-grid-4">
        {metrics.map((m) => (
          <div key={m.label} className="ct-hero-inset">
            <p className="ct-caption font-semibold uppercase inline-flex items-center gap-0.5">
              {m.label}
              {m.tip ? <InfoTip text={m.tip} /> : null}
            </p>
            <p
              className={cn(
                "ct-hero-metric mt-1",
                m.tone === "success" && "ct-hero-metric-success",
                m.tone === "warn" && "ct-hero-metric-warn"
              )}
            >
              {m.value}
            </p>
          </div>
        ))}
      </div>
      {footer ? <Caption>{footer}</Caption> : null}
      {children}
    </Card>
  );
}
