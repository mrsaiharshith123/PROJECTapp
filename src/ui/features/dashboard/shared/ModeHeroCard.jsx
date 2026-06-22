import { cn } from "../../../utils/cn.js";
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
    <div className="text-left min-w-0">
      <p className="ct-stat-label">{label}</p>
      <p className={cn("ct-stat-value mt-0.5 truncate", valueClass)}>{value}</p>
      {sub && <p className="ct-stat-label mt-0.5 leading-snug">{sub}</p>}
    </div>
  );
}

/** Mode hero strip: title + 2×2 metrics + optional tip. */
export default function ModeHeroCard({ title, subtitle, icon, metrics = [], tip, variant = "lending" }) {
  return (
    <div className={cn("ct-hero-card", variant)}>
      <div className="ct-hero-glow teal" aria-hidden />
      <div className="ct-row items-start gap-3 pb-3 relative">
        {icon && (
          <span className="ct-icon-tile ct-icon-tile-sm indigo shrink-0" aria-hidden>
            <CtIcon name={icon} size={20} />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="ct-h2">{title}</h2>
          {subtitle && <Caption className="mt-0.5 block opacity-90">{subtitle}</Caption>}
        </div>
      </div>
      {metrics.length > 0 && (
        <div className="ct-grid-2 pb-2 relative">
          {metrics.map((m) => (
            <div key={m.label} className="ct-stat-tile">
              <HeroMetric {...m} />
            </div>
          ))}
        </div>
      )}
      {tip && <div className="ct-stat-tile teal ct-body !text-xs relative">{tip}</div>}
    </div>
  );
}
