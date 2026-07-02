import { Heading, Caption, CtIcon } from "../../index.js";
import { cn } from "../../utils/cn.js";

/** @param {"violet"|"teal"|"amber"|"red"|"slate"|"gold"|"indigo"} color @param {boolean} danger */
function tileColorClass(color, danger) {
  if (danger) return "danger";
  if (color === "red") return "danger";
  if (color === "slate") return "slate";
  if (color === "gold") return "gold";
  if (color === "indigo") return "indigo";
  return color;
}

/**
 * @param {{ title: string, icon?: string, children: import('react').ReactNode, description?: string }} props
 */
export function SettingsGroup({ title, icon, children, description }) {
  return (
    <section className="ct-settings-group ct-settings-group-modern">
      <div className="ct-settings-group-head">
        {icon ? <CtIcon name={icon} size={16} context="info" /> : null}
        <div>
          <Heading level={4} className="ct-settings-group-title">
            {title}
          </Heading>
          {description ? <Caption>{description}</Caption> : null}
        </div>
      </div>
      <div className="ct-settings-group-body">{children}</div>
    </section>
  );
}

/**
 * @param {{ children: import('react').ReactNode, className?: string }} props
 */
export function SettingsGroupContent({ children, className }) {
  return <div className={cn("ct-settings-group-content", className)}>{children}</div>;
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
  const tileClass = tileColorClass(iconColor, danger);
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={cn("ct-settings-row", danger && "ct-settings-row-danger", !onClick && "ct-settings-row-static")}
      onClick={onClick}
      disabled={disabled}
    >
      {icon ? (
        <span className={cn("ct-icon-tile ct-icon-tile-sm", tileClass)}>
          <CtIcon name={icon} size={18} weight="duotone" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="ct-settings-row-label">{label}</span>
        {hint ? <Caption className="block mt-0.5 opacity-80">{hint}</Caption> : null}
      </span>
      {rightElement ? (
        <span className="ct-settings-row-value shrink-0">{rightElement}</span>
      ) : value ? (
        <span className="ct-settings-row-value">{value}</span>
      ) : onClick ? (
        <CtIcon name="chevron-right" size={14} className="ct-settings-chevron-icon shrink-0" aria-hidden />
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
  const tileClass = tileColorClass(iconColor, false);

  return (
    <label className={cn("ct-settings-row ct-settings-toggle-row", disabled && "opacity-60")}>
      {icon ? (
        <span className={cn("ct-icon-tile ct-icon-tile-sm", tileClass)}>
          <CtIcon name={icon} size={18} weight="duotone" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="ct-settings-row-label">{label}</span>
        {hint ? <Caption className="block mt-0.5 opacity-80">{hint}</Caption> : null}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="ct-checkbox shrink-0"
      />
    </label>
  );
}