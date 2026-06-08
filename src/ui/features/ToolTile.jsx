import { cn } from "../utils/cn.js";
import { CtIcon } from "../icons/CtIcon.jsx";

/**
 * @param {{ icon?: string, label?: string, title?: string, subtitle?: string, accent?: string, onClick?: () => void, disabled?: boolean, className?: string }} props
 */
export function ToolTile({ icon, label, title, subtitle, onClick, disabled, className = "" }) {
  const primary = label || title || "";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn("ct-tool-tile", disabled && "opacity-60 cursor-default", className)}
    >
      <span className="ct-tool-tile-icon">{icon ? <CtIcon name={icon} size={24} context="tile" /> : null}</span>
      <span className="ct-tool-tile-label">{primary}</span>
      {subtitle && <span className="ct-tool-tile-sub">{subtitle}</span>}
    </button>
  );
}

export default ToolTile;
