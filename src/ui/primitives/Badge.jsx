import { cn } from "../utils/cn.js";
import { semanticToneToClass } from "../tokens/semanticBadge.js";

/**
 * @param {{ children: import('react').ReactNode, className?: string, tone?: string }} props
 */
export function Badge({ children, className = "", tone }) {
  const toneClass = semanticToneToClass(tone || "neutral");
  return <span className={cn(toneClass, className)}>{children}</span>;
}

export default Badge;
