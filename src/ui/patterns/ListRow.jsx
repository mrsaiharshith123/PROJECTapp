import { createElement } from "react";
import { Row } from "../primitives/Stack.jsx";
import { Body, Caption } from "../primitives/Text.jsx";
import { Badge } from "../primitives/Badge.jsx";
import { CtIcon } from "../icons/CtIcon.jsx";

/**
 * @param {{ icon?: string, title: string, subtitle?: string, amount?: string, amountTone?: 'positive' | 'negative' | 'neutral', status?: string, statusTone?: string, onClick?: () => void, as?: string }} props
 */
export function ListRow({
  icon,
  title,
  subtitle,
  amount,
  amountTone = "neutral",
  status,
  statusTone,
  onClick,
  as: Tag = "div",
}) {
  const amountStyle =
    amountTone === "positive"
      ? { color: "var(--ed-green)" }
      : amountTone === "negative"
        ? { color: "var(--ed-red)" }
        : { color: "var(--ed-ink)", fontWeight: 700 };
  const inner = (
    <>
      <Row className="min-w-0 flex-1">
        {icon && (
          <span className="ed-row-icon">
            <CtIcon name={icon} size={20} />
          </span>
        )}
        <div className="min-w-0">
          <Body className="font-semibold truncate block" style={{ color: "var(--ed-ink)" }}>
            {title}
          </Body>
          {subtitle && <Caption className="block truncate">{subtitle}</Caption>}
        </div>
      </Row>
      <div className="text-right shrink-0">
        {amount && (
          <Body className="block" style={amountStyle}>
            {amount}
          </Body>
        )}
        {status && <Badge tone={statusTone} className="mt-1">{status}</Badge>}
      </div>
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="ed-nav-row w-full text-left">
        {inner}
      </button>
    );
  }
  return createElement(Tag, { className: "ed-nav-row w-full text-left" }, inner);
}
