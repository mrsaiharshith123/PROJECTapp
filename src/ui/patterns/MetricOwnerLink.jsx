import { Link } from "react-router-dom";

/**
 * One-line cross-reference to the screen that owns a metric (dedupes hero cards elsewhere).
 * @param {{ label: string, value?: string, to: string, className?: string }} props
 */
export function MetricOwnerLink({ label, value, to, className = "" }) {
  return (
    <Link to={to} className={`ct-metric-owner-link ${className}`.trim()}>
      <span className="ct-metric-owner-link-label">{label}</span>
      {value ? <span className="ct-metric-owner-link-value">{value}</span> : null}
      <span className="ct-metric-owner-link-arrow" aria-hidden>
        →
      </span>
    </Link>
  );
}
