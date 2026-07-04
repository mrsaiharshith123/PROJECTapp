import { cn } from "../utils/cn.js";
import { CtIcon } from "../icons/CtIcon.jsx";

const ACCENT_TILE = {
  indigo: "indigo",
  teal: "teal",
  amber: "amber",
  violet: "violet",
  gold: "amber",
  rose: "danger",
  instrument: "indigo",
  liability: "danger",
  goal: "amber",
  asset: "teal",
};

/**
 * @param {{ icon?: string, label?: string, title?: string, subtitle?: string, accent?: string, onClick?: () => void, disabled?: boolean, className?: string }} props
 */
export function ToolTile({ icon, label, title, subtitle, accent = "indigo", onClick, disabled, className = "" }) {
  const primary = label || title || "";
  const tileTone = ACCENT_TILE[accent] || "indigo";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "ed-inset  !p-3 text-center ",
        tileTone,
        disabled && "opacity-60 cursor-default",
        className,
      )}
    >
      <span className={cn("ed-row-icon mx-auto mb-2", tileTone)} aria-hidden>
        {icon ? <CtIcon name={icon} size={22} /> : null}
      </span>
      <span className="ed-stat-label block font-semibold">{primary}</span>
      {subtitle ? <span className="block text-[10px] opacity-70 mt-0.5 leading-tight">{subtitle}</span> : null}
    </button>
  );
}