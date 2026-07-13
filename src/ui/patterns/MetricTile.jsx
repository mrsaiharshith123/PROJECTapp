import { memo } from "react";
import { ConceptHelp } from "../guidance/ConceptHelp.jsx";

/** @param {{ label: string, value: string, valueClassName?: string, caption?: string, conceptId?: string, className?: string }} props */
function MetricTileImpl({
  label,
  value,
  valueClassName = "",
  caption = undefined,
  conceptId = undefined,
  className = "",
}) {
  return (
    <div className={`ed-metric ${className}`.trim()}>
      <span className={`ed-metric-value ed-numeral ed-numeral ${valueClassName}`.trim()}>{value}</span>
      <span className="ed-metric-label">
        {label}
        {conceptId ? <ConceptHelp conceptId={conceptId} /> : null}
      </span>
      {caption ? <span className="ed-caption">{caption}</span> : null}
    </div>
  );
}

export const MetricTile = memo(MetricTileImpl);
