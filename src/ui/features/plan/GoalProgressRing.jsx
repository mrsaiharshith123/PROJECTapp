import { cn } from "../../utils/cn.js";

/** @param {"teal" | "amber" | "danger"} tone */
function ringColor(tone) {
  if (tone === "danger") return "var(--ct-danger)";
  if (tone === "amber") return "var(--ct-warning)";
  return "var(--ct-success)";
}

/**
 * Small conic progress ring for goal cards.
 * @param {{ percent: number, tone?: "teal" | "amber" | "danger", size?: number, className?: string }} props
 */
export default function GoalProgressRing({ percent, tone = "teal", size = 40, className = "" }) {
  const pct = Math.min(100, Math.max(0, Number(percent) || 0));
  const deg = (pct / 100) * 360;
  const color = ringColor(tone);
  const inner = Math.round(size * 0.75);

  return (
    <div
      className={cn("ct-conic-ring shrink-0", className)}
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} 0deg ${deg}deg, rgba(255,255,255,0.08) ${deg}deg 360deg)`,
      }}
      aria-hidden
    >
      <div className="ct-conic-ring-inner" style={{ width: inner, height: inner }}>
        <span className="text-[10px] font-semibold tabular-nums" style={{ color }}>
          {Math.round(pct)}
        </span>
      </div>
    </div>
  );
}
