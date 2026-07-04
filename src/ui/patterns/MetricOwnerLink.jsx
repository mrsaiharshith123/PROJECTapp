import { Link } from "react-router-dom";

/**
 * One-line cross-reference to the screen that owns a metric (dedupes hero cards elsewhere).
 * @param {{ label: string, value?: string, to: string, className?: string }} props
 */
export function MetricOwnerLink({ label, value, to, className = "" }) {
  return (
    <Link to={to} className={`ed-link ${className}`.trim()}>
      <span className="ed-field-label">{label}</span>
      {value ? <span className="ed-numeral">{value}</span> : null}
      <span className="ed-link" aria-hidden>
        →
      </span>
    </Link>
  );
}
