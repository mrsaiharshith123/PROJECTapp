import { cn } from "../utils/cn.js";

export function StatCard({ value, label, className = "", valueClassName = "", variant = "default" }) {
  const tile = variant === "tile";
  return (
    <div className={cn(tile ? "ed-inset" : "ed-metric", className)}>
      <span className={cn(tile ? "ed-stat-value ed-numeral" : "ed-metric-value ed-numeral", valueClassName)}>
        {value}
      </span>
      <span className={tile ? "ed-stat-label" : "ed-metric-label"}>{label}</span>
    </div>
  );
}

export default StatCard;
