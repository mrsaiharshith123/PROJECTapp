import { CtIcon } from "../../index.js";
import { cn } from "../../utils/cn.js";

/** @param {"violet"|"teal"|"amber"|"red"|"slate"|"gold"|"indigo"} color @param {boolean} danger */
function toneClass(color, danger) {
  if (danger || color === "red") return "danger";
  return color || "slate";
}

/**
 * @param {{ title: string, icon?: string, children: import('react').ReactNode, description?: string }} props
 */
export function SettingsGroup({ title, icon, children, description }) {
  return (
    <section className="ed-settings-group">
      <div className="ed-settings-group-head">
        {icon ? <CtIcon name={icon} size={15} /> : null}
        <div className="min-w-0 flex-1">
          <p className="ed-settings-group-title">{title}</p>
          {description ? <p className="ed-settings-group-desc">{description}</p> : null}
        </div>
      </div>
      <div className="ed-settings-group-body">{children}</div>
    </section>
  );
}

/**
 * @param {{ children: import('react').ReactNode, className?: string }} props
 */
export function SettingsGroupContent({ children, className }) {
  return <div className={cn("ed-settings-group-content", className)}>{children}</div>;
}

/**
 * @param {{
 *   label: string,
 *   value?: string,
 *   hint?: string,
 *   onClick?: () => void,
 *   icon?: string,
 *   iconColor?: "violet"|"teal"|"amber"|"red"|"slate"|"gold"|"indigo",
 *   danger?: boolean,
 *   disabled?: boolean,
 *   rightElement?: import('react').ReactNode,
 * }} props
 */
export function SettingsGroupRow({
  label,
  value,
  hint,
  onClick,
  icon,
  iconColor = "slate",
  danger = false,
  disabled = false,
  rightElement,
}) {
  const tone = toneClass(iconColor, danger);
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={cn("ed-settings-row", danger && "ed-settings-row-danger", !onClick && "ed-settings-row-static")}
      onClick={onClick}
      disabled={disabled}
    >
      {icon ? (
        <span className={cn("ed-icon-tile ed-icon-tile-sm", tone)}>
          <CtIcon name={icon} size={17} weight="duotone" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="ed-settings-row-label">{label}</span>
        {hint ? <span className="ed-settings-row-hint">{hint}</span> : null}
      </span>
      {rightElement ? (
        <span className="ed-settings-row-value shrink-0">{rightElement}</span>
      ) : value ? (
        <span className="ed-settings-row-value">{value}</span>
      ) : onClick ? (
        <CtIcon name="caret-right" size={13} className="ed-settings-chevron shrink-0" aria-hidden />
      ) : null}
    </Tag>
  );
}

/**
 * @param {{
 *   icon?: string,
 *   iconColor?: "violet"|"teal"|"amber"|"red"|"slate"|"gold"|"indigo",
 *   label: string,
 *   hint?: string,
 *   checked: boolean,
 *   onChange: (e: import('react').ChangeEvent<HTMLInputElement>) => void,
 *   disabled?: boolean,
 * }} props
 */
export function SettingsGroupToggleRow({
  icon,
  iconColor = "slate",
  label,
  hint,
  checked,
  onChange,
  disabled = false,
}) {
  return (
    <label className={cn("ed-settings-row ed-settings-toggle-row", disabled && "opacity-50")}>
      {icon ? (
        <span className={cn("ed-icon-tile ed-icon-tile-sm", toneClass(iconColor, false))}>
          <CtIcon name={icon} size={17} weight="duotone" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="ed-settings-row-label">{label}</span>
        {hint ? <span className="ed-settings-row-hint">{hint}</span> : null}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="ed-toggle shrink-0"
      />
    </label>
  );
}
