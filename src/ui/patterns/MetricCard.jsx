import { cn } from "../utils/cn.js";
import { CtIcon } from "../icons/CtIcon.jsx";
import { useCountUp } from "../hooks/useCountUp.js";

const TREND_ICON = {
  up: "chart-line-up",
  down: "chart-line-down",
  flat: "hourglass",
};

const TREND_STYLE = {
  up: { color: "var(--ed-green)" },
  down: { color: "var(--ed-red)" },
  flat: { opacity: 0.6 },
};

function MetricCardValue({ value, animateValue }) {
  const numeric =
    typeof value === "number" ? value : Number(String(value).replace(/[^\d.-]/g, ""));
  const animated = useCountUp(Number.isFinite(numeric) ? numeric : 0, 800);
  if (animateValue && Number.isFinite(numeric)) return animated;
  return value;
}

/**
 * Unified KPI card — max 5 elements: label, value, context, micro-visual, tap affordance.
 * @param {{
 *   label: string,
 *   value: string | number,
 *   context?: string,
 *   trend?: 'up' | 'down' | 'flat' | null,
 *   icon?: string,
 *   tone?: string,
 *   animateValue?: boolean,
 *   className?: string,
 *   onClick?: () => void,
 *   children?: import('react').ReactNode,
 * }} props
 */
export function MetricCard({
  label,
  value,
  context,
  trend = null,
  icon,
  tone: _tone = "indigo",
  animateValue = false,
  className = "",
  onClick,
  children,
}) {
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn("ed-inset text-left w-full", onClick && "cursor-pointer", className)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="ed-field-label">{label}</p>
        {icon ? (
          <span className="shrink-0" aria-hidden>
            <CtIcon name={icon} size={16} />
          </span>
        ) : null}
      </div>
      <p className="ed-numeral mt-1">
        <MetricCardValue value={value} animateValue={animateValue} />
      </p>
      {context ? <p className="text-[10px] opacity-75 mt-0.5 leading-snug">{context}</p> : null}
      {trend ? (
        <span
          className="inline-flex items-center gap-1 text-[10px] mt-1 font-medium"
          style={TREND_STYLE[trend]}
        >
          <CtIcon name={TREND_ICON[trend]} size={12} />
        </span>
      ) : null}
      {children}
    </Tag>
  );
}

export default MetricCard;
