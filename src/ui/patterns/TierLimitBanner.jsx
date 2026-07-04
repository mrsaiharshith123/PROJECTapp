import { useNavigate } from "react-router-dom";
import { Card, Button, Caption, Body } from "../index.js";

/**
 * @param {{ title: string, message: string, compact?: boolean, className?: string }} props
 */
export function TierLimitBanner({ title, message, compact = false, className = "" }) {
  const navigate = useNavigate();
  if (compact) {
    return (
      <Caption className="block" style={{ color: "var(--ed-amber)" }}>
        {message}{" "}
        <button type="button" className="ed-link ed-link--xs" onClick={() => navigate("/profile#upgrade")}>
          View plans
        </button>
      </Caption>
    );
  }
  return (
    <Card className={`ed-stack-sm ed-inset-amber ${className}`.trim()}>
      <Body className="font-semibold">{title}</Body>
      <Caption className="block">{message}</Caption>
      <Button type="button" variant="primary" size="sm" onClick={() => navigate("/profile#upgrade")}>
        View plans
      </Button>
    </Card>
  );
}
