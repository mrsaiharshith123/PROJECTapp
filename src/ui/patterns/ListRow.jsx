import { createElement } from "react";
import { Row } from "../primitives/Stack.jsx";
import { Body, Caption } from "../primitives/Text.jsx";
import { Badge } from "../primitives/Badge.jsx";

/**
 * @param {{ icon?: string, title: string, subtitle?: string, amount?: string, status?: string, statusTone?: string, onClick?: () => void, as?: string }} props
 */
export function ListRow({ icon, title, subtitle, amount, status, statusTone, onClick, as: Tag = "div" }) {
  const inner = (
    <>
      <Row className="min-w-0 flex-1">
        {icon && <span className="ct-icon-box">{icon}</span>}
        <div className="min-w-0">
          <Body className="font-semibold text-[var(--ct-text)] truncate block">{title}</Body>
          {subtitle && <Caption className="block truncate">{subtitle}</Caption>}
        </div>
      </Row>
      <div className="text-right shrink-0">
        {amount && <Body className="font-bold text-[var(--ct-text)] block">{amount}</Body>}
        {status && <Badge tone={statusTone} className="mt-1">{status}</Badge>}
      </div>
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="ct-list-row w-full text-left">
        {inner}
      </button>
    );
  }
  return createElement(Tag, { className: "ct-list-row w-full text-left" }, inner);
}
