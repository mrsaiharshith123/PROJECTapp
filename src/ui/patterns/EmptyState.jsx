import { Card } from "../primitives/Card.jsx";
import { Body, Caption } from "../primitives/Text.jsx";
import { CtIcon } from "../icons/CtIcon.jsx";

export function EmptyState({ icon = "clipboard-text", title, hint }) {
  return (
    <Card variant="flat" className="text-center py-8">
      <p className="mb-2 flex justify-center" aria-hidden>
        <CtIcon name={icon} size={36} context="empty" className="ct-icon-muted" />
      </p>
      <Body className="font-medium">{title}</Body>
      {hint && <Caption className="mt-1 block">{hint}</Caption>}
    </Card>
  );
}
