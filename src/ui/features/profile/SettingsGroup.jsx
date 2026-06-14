import { Heading, Caption, CtIcon } from "../../index.js";
import { cn } from "../../utils/cn.js";

/**
 * @param {{ title: string, icon?: string, children: import('react').ReactNode, description?: string }} props
 */
export function SettingsGroup({ title, icon, children, description }) {
  return (
    <section className="ct-settings-group">
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
 * Grouped settings list row (ct-settings-row).
 * @param {{ label: string, value?: string, onClick?: () => void, icon?: string, danger?: boolean, disabled?: boolean }} props
 */
export function SettingsGroupRow({ label, value, onClick, icon, danger = false, disabled = false }) {
  return (
    <button
      type="button"
      className={cn("ct-settings-row", danger && "ct-settings-row-danger")}
      onClick={onClick}
      disabled={disabled}
    >
      {icon ? <CtIcon name={icon} size={18} context="info" /> : null}
      <span className="ct-settings-row-label">{label}</span>
      {value ? <span className="ct-settings-row-value">{value}</span> : null}
      <span className="ct-settings-chevron" aria-hidden>
        ›
      </span>
    </button>
  );
}

export default SettingsGroup;
