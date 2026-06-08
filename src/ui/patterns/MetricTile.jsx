import { ConceptHelp } from "../guidance/ConceptHelp.jsx";

/** @param {{ label: string, value: string, valueClassName?: string, caption?: string, conceptId?: string, className?: string }} props */
export function MetricTile({
  label,
  value,
  valueClassName = "",
  caption = undefined,
  conceptId = undefined,
  className = "",
}) {
  return (
    <div className={`ct-metric ${className}`.trim()}>
      <span className={`ct-metric-value ct-numeral ${valueClassName}`.trim()}>{value}</span>
      <span className="ct-metric-label">
        {label}
        {conceptId ? <ConceptHelp conceptId={conceptId} /> : null}
      </span>
      {caption ? <span className="ct-metric-caption">{caption}</span> : null}
    </div>
  );
}
