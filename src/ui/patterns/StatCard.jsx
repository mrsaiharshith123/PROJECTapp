import { cn } from "../utils/cn.js";

export function StatCard({ value, label, className = "", valueClassName = "", variant = "default" }) {
  const tile = variant === "tile";
  return (
    <div className={cn(tile ? "ct-stat-tile" : "ct-metric", className)}>
      <span className={cn(tile ? "ct-stat-value ct-numeral" : "ct-metric-value ct-numeral", valueClassName)}>
        {value}
      </span>
      <span className={tile ? "ct-stat-label" : "ct-metric-label"}>{label}</span>
    </div>
  );
}

export default StatCard;
