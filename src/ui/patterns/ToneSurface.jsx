import { cn } from "../utils/cn.js";
import { insightToneClass } from "../tokens/severity.js";

/**
 * @param {{ tone?: string, children: import('react').ReactNode, className?: string }} props
 */
export function ToneSurface({ tone = "neutral", children, className = "" }) {
  return (
    <div className={cn(insightToneClass(tone), "text-sm leading-relaxed", className)}>
      {children}
    </div>
  );
}

export default ToneSurface;
