import { useNavigate } from "react-router-dom";
import { Card, Button, Caption, Body } from "../index.js";

/**
 * @param {{ title: string, message: string, compact?: boolean, className?: string }} props
 */
export function TierLimitBanner({ title, message, compact = false, className = "" }) {
  const navigate = useNavigate();
  if (compact) {
    return (
      <Caption className="block text-[var(--ct-warning)]">
        {message}{" "}
        <button type="button" className="ct-link !text-xs" onClick={() => navigate("/profile#upgrade")}>
          View plans
        </button>
      </Caption>
    );
  }
  return (
    <Card className={`ct-stack-sm border-[var(--ct-warning)]/30 bg-[var(--ct-warning-soft)] ${className}`.trim()}>
      <Body className="font-semibold">{title}</Body>
      <Caption className="block">{message}</Caption>
      <Button type="button" variant="primary" size="sm" onClick={() => navigate("/profile#upgrade")}>
        View plans
      </Button>
    </Card>
  );
}
