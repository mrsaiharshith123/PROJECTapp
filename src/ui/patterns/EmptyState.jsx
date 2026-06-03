import { Card } from "../primitives/Card.jsx";
import { Body, Caption } from "../primitives/Text.jsx";

export function EmptyState({ icon = "📋", title, hint }) {
  return (
    <Card variant="flat" className="text-center py-8">
      <p className="text-3xl mb-2" aria-hidden>
        {icon}
      </p>
      <Body className="font-medium">{title}</Body>
      {hint && <Caption className="mt-1 block">{hint}</Caption>}
    </Card>
  );
}
