import { cn } from "../utils/cn.js";
import { Card } from "../primitives/Card.jsx";
import { Caption } from "../primitives/Text.jsx";

export function StatCard({ value, label, className = "", valueClassName = "" }) {
  return (
    <Card variant="flat" className={cn("text-center !py-4", className)}>
      <p className={cn("text-lg font-bold text-[var(--ct-text)]", valueClassName)}>{value}</p>
      <Caption className="mt-0.5 block font-semibold">{label}</Caption>
    </Card>
  );
}

export default StatCard;
