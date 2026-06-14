import { CtIcon } from "../icons/CtIcon.jsx";
import { cn } from "../utils/cn.js";

/**
 * iOS-style settings list row (also supports legacy hint/active for profile picker).
 * @param {{
 *   icon?: string,
 *   iconColor?: "violet" | "teal" | "amber" | "red" | "slate",
 *   label: string,
 *   value?: string,
 *   hint?: string,
 *   onClick?: () => void,
 *   danger?: boolean,
 *   disabled?: boolean,
 *   active?: boolean,
 *   rightElement?: import('react').ReactNode,
 * }} props
 */
export function SettingsRow({
  icon,
  iconColor = "slate",
  label,
  value,
  hint,
  onClick,
  danger = false,
  disabled = false,
  active = false,
  rightElement,
}) {
  if (hint != null) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`ct-list-row w-full text-left ${active ? "ct-settings-tile-active" : ""}`}
      >
        <div className="ct-row min-w-0 flex-1 gap-3">
          {icon ? (
            <span className="ct-icon-box">
              <CtIcon name={icon} size={20} />
            </span>
          ) : null}
          <div className="min-w-0">
            <span className={`font-semibold block truncate ${active ? "ct-text-accent" : ""}`}>{label}</span>
            <span className="ct-caption block truncate mt-0.5">{hint}</span>
          </div>
        </div>
        <span className="ct-settings-chevron" aria-hidden>
          ›
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={cn("ct-settings-row", danger && "ct-settings-row-danger")}
      onClick={onClick}
      disabled={disabled}
    >
      {icon ? (
        <span className={cn("ct-settings-row-icon", `ct-settings-icon-${iconColor}`)}>
          <CtIcon name={icon} size={18} weight="duotone" />
        </span>
      ) : null}
      <span className="ct-settings-row-label">{label}</span>
      {value ? <span className="ct-settings-row-value">{value}</span> : null}
      {rightElement ? <span className="ct-settings-row-value">{rightElement}</span> : null}
      {!rightElement ? (
        <CtIcon name="caret-right" size={14} className="ct-settings-row-caret" />
      ) : null}
    </button>
  );
}

/**
 * @param {{ label?: string, children: import('react').ReactNode }} props
 */
export function SettingsSection({ label, children }) {
  return (
    <div className="ct-settings-section">
      {label ? <div className="ct-settings-section-label">{label}</div> : null}
      <div className="ct-settings-list">{children}</div>
    </div>
  );
}

export default SettingsRow;
