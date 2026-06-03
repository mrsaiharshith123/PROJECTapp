export function MetricTile({ label, value, valueClassName = "", className = "" }) {
  return (
    <div className={`ct-metric ${className}`.trim()}>
      <span className={`ct-metric-value ${valueClassName}`.trim()}>{value}</span>
      <span className="ct-metric-label">{label}</span>
    </div>
  );
}
