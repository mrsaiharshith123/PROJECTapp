import { cn } from "../../utils/cn.js";

/**
 * Small conic progress ring for goal cards.
 * @param {{ percent: number, tone?: "teal" | "amber" | "danger", size?: number, className?: string }} props
 */
export default function GoalProgressRing({ percent, tone = "teal", size = 40, className = "" }) {
  const pct = Math.min(100, Math.max(0, Number(percent) || 0));
  const deg = (pct / 100) * 360;
  const color =
    tone === "danger" ? "#f87171" : tone === "amber" ? "#fbbf24" : "#2dd4bf";

  return (
    <span
      className={cn("ct-goal-progress-ring", className)}
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} 0deg ${deg}deg, rgba(255,255,255,0.08) ${deg}deg 360deg)`,
      }}
      aria-hidden
    />
  );
}
