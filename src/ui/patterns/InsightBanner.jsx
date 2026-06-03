import { cn } from "../utils/cn.js";
import { Body } from "../primitives/Text.jsx";

export function InsightBanner({ children, variant = "success", className = "" }) {
  const v =
    variant === "warning" ? "ct-insight ct-insight-warning" : variant === "info" ? "ct-insight ct-insight-info" : "ct-insight";
  return (
    <div className={cn(v, className)}>
      <Body>{children}</Body>
    </div>
  );
}
