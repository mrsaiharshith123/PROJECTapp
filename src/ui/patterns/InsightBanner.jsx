import { cn } from "../utils/cn.js";
import { Body } from "../primitives/Text.jsx";

export function InsightBanner({ children, variant = "success", className = "" }) {
  const v =
    variant === "warning" ? "ed-inset ed-inset-amber" : variant === "info" ? "ed-inset ed-inset" : "ed-inset";
  return (
    <div className={cn(v, className)}>
      <Body>{children}</Body>
    </div>
  );
}
