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
        className={cn("ed-nav-row w-full text-left", active && "border-l-2 border-[var(--ed-gold)]")}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {icon ? (
            <span className="ed-row-icon">
              <CtIcon name={icon} size={20} />
            </span>
          ) : null}
          <div className="min-w-0">
            <span
              className="font-semibold block truncate"
              style={active ? { color: "var(--ed-gold)" } : undefined}
            >
              {label}
            </span>
            <span className="ed-caption block truncate mt-0.5">{hint}</span>
          </div>
        </div>
        <span className="ed-settings-row-caret" aria-hidden>
          ›
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={cn("ed-settings-row", danger && "ed-settings-row-danger")}
      onClick={onClick}
      disabled={disabled}
    >
      {icon ? (
        <span className={cn("ed-settings-row-icon", `ed-settings-icon-${iconColor}`)}>
          <CtIcon name={icon} size={18} weight="duotone" />
        </span>
      ) : null}
      <span className="ed-settings-row-label">{label}</span>
      {value ? <span className="ed-settings-row-value">{value}</span> : null}
      {rightElement ? <span className="ed-settings-row-value">{rightElement}</span> : null}
      {!rightElement ? (
        <CtIcon name="caret-right" size={14} className="ed-settings-row-caret" />
      ) : null}
    </button>
  );
}

/**
 * @param {{ label?: string, children: import('react').ReactNode }} props
 */
export function SettingsSection({ label, children }) {
  return (
    <div className="ed-settings-section">
      {label ? <div className="ed-settings-section-label">{label}</div> : null}
      <div className="ed-settings-list">{children}</div>
    </div>
  );
}

export default SettingsRow;
