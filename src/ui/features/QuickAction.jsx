import { CtIcon } from "../icons/CtIcon.jsx";
import { cn } from "../utils/cn.js";

/**
 * @param {{ icon?: string, label: string, onClick?: () => void, disabled?: boolean, primary?: boolean }} props
 * icon: Phosphor key, or "+" for add action text
 */
export function QuickAction({ icon, label, onClick, disabled = false, primary = false }) {
  const inactive = disabled || !onClick;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={inactive}
      className={cn(
        "ct-quick-action",
        inactive && "ct-quick-action-inactive",
        primary && "ct-quick-action-primary",
      )}
    >
      <span className="ct-quick-action-icon">
        {icon === "+" ? "+" : icon ? <CtIcon name={icon} size={22} /> : null}
      </span>
      <span className="ct-quick-action-label">{label}</span>
    </button>
  );
}

export function QuickActionRow({ children }) {
  return <div className="ct-quick-action-row">{children}</div>;
}
