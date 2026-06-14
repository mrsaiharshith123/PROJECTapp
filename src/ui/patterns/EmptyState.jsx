import { Heading, Body, CtIcon } from "../index.js";

/**
 * @param {{ icon?: string, title: string, message?: string, hint?: string, action?: import('react').ReactNode }} props
 */
export function EmptyState({ icon = "clipboard-text", title, message, hint, action }) {
  const body = message || hint;
  return (
    <div className="ct-empty-state">
      {icon ? (
        <div className="ct-empty-icon">
          <CtIcon name={icon} size={32} context="empty" />
        </div>
      ) : null}
      <Heading level={4} className="ct-empty-title">
        {title}
      </Heading>
      {body ? <Body className="ct-empty-message">{body}</Body> : null}
      {action ? <div className="ct-empty-action">{action}</div> : null}
    </div>
  );
}

export default EmptyState;
