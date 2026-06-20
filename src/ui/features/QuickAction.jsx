import { CtIcon } from "../icons/CtIcon.jsx";
import { cn } from "../utils/cn.js";

/**
 * @param {{ icon?: string, label: string, onClick?: () => void, disabled?: boolean, primary?: boolean, tone?: 'amber' | 'teal' | 'violet' }} props
 */
export function QuickAction({ icon, label, onClick, disabled = false, primary = false, tone }) {
  const inactive = disabled || !onClick;
  const tileTone = primary ? "primary" : tone;

  return (
    <div className="ct-icon-tile-wrap">
      <button
        type="button"
        onClick={onClick}
        disabled={inactive}
        className={cn(
          "ct-icon-tile",
          tileTone === "primary" && "primary",
          tileTone === "amber" && "amber",
          tileTone === "teal" && "teal",
          tileTone === "violet" && "violet",
          !tileTone && !primary && "bg-[rgba(255,255,255,0.04)] text-[var(--ct-text)]",
        )}
      >
        {icon === "+" ? "+" : icon ? <CtIcon name={icon} size={22} /> : null}
      </button>
      <span className="ct-icon-tile-label">{label}</span>
    </div>
  );
}

export function QuickActionRow({ children }) {
  return <div className="ct-quick-action-row-modern">{children}</div>;
}
