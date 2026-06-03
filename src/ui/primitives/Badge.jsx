import { cn } from "../utils/cn.js";

/**
 * @param {{ children: import('react').ReactNode, className?: string, tone?: string }} props
 */
export function Badge({ children, className = "", tone }) {
  const toneClass =
    tone === "success"
      ? "ct-status ct-status-success"
      : tone === "warning"
        ? "ct-status ct-status-warning"
        : tone === "danger"
          ? "ct-status ct-status-danger"
          : null;
  return <span className={cn(toneClass || "ct-status ct-status-neutral", className)}>{children}</span>;
}

export default Badge;
