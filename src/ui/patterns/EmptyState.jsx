import { Heading, Body, CtIcon } from "../index.js";

/**
 * @param {{ icon?: string, title: string, message?: string, hint?: string, action?: import('react').ReactNode }} props
 */
export function EmptyState({ icon = "clipboard-text", title, message, hint, action }) {
  const body = message || hint;
  return (
    <div className="ed-empty-state">
      {icon ? (
        <div className="ed-empty-icon">
          <CtIcon name={icon} size={32} context="empty" />
        </div>
      ) : null}
      <Heading level={4}>{title}</Heading>
      {body ? <Body className="ed-caption">{body}</Body> : null}
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export default EmptyState;
