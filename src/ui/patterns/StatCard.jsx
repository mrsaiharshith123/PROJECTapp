import { cn } from "../utils/cn.js";

export function StatCard({ value, label, className = "", valueClassName = "" }) {
  return (
    <div className={cn("ct-metric", className)}>
      <span className={cn("ct-metric-value ct-numeral", valueClassName)}>{value}</span>
      <span className="ct-metric-label">{label}</span>
    </div>
  );
}

export default StatCard;
