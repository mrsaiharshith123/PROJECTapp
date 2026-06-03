import { cn } from "../utils/cn.js";
import { insightToneClass } from "../tokens/severity.js";

/**
 * @param {{ tone?: string, children: import('react').ReactNode, className?: string }} props
 */
export function ToneSurface({ tone = "neutral", children, className = "" }) {
  return (
    <div className={cn("px-3 py-2.5 text-sm leading-relaxed border", insightToneClass(tone), className)}>
      {children}
    </div>
  );
}

export default ToneSurface;
