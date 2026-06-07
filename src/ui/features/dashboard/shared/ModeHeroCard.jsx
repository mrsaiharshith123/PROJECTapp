import { Card } from "../../../primitives/Card.jsx";
import { Caption } from "../../../primitives/Text.jsx";
import { CtIcon } from "../../../icons/CtIcon.jsx";

function HeroMetric({ label, value, sub, tone = "default" }) {
  const valueClass =
    tone === "good"
      ? "ct-metric-value-success"
      : tone === "warn"
        ? "ct-hero-metric-warn"
        : tone === "danger"
          ? "ct-hero-metric-danger"
          : tone === "accent"
            ? "ct-metric-value-accent"
            : "";
  return (
    <div className="ct-metric text-left min-w-0">
      <Caption className="font-semibold uppercase block">{label}</Caption>
      <p className={`ct-metric-value mt-0.5 truncate ${valueClass}`.trim()}>{value}</p>
      {sub && <Caption className="mt-0.5 block leading-snug">{sub}</Caption>}
    </div>
  );
}

/** Mode hero strip: title + 2×2 metrics + optional tip. */
export default function ModeHeroCard({ title, subtitle, icon, metrics = [], tip }) {
  return (
    <Card variant="hero" className="!pb-3">
      <div className="ct-row items-start gap-3 pb-3">
        {icon && (
          <span className="ct-hero-month-icon shrink-0" aria-hidden>
            <CtIcon name={icon} size={28} />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="ct-h2">{title}</h2>
          {subtitle && <Caption className="mt-0.5 block opacity-90">{subtitle}</Caption>}
        </div>
      </div>
      {metrics.length > 0 && (
        <div className="ct-grid-2 pb-2">
          {metrics.map((m) => (
            <HeroMetric key={m.label} {...m} />
          ))}
        </div>
      )}
      {tip && <div className="ct-hero-inset ct-body !text-xs mx-1 mb-1">{tip}</div>}
    </Card>
  );
}
