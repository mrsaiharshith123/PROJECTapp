import { cn } from "../utils/cn.js";
import { Caption } from "../primitives/Text.jsx";

/**
 * Shared hero block for calculator / tool result summaries.
 * @param {{ label?: string, value?: string, subtitle?: string, tone?: "sim"|"wealth"|"survival"|"lending"|"pressure", className?: string, children?: import('react').ReactNode }} props
 */
export function ToolAnswerHero({ label, value, subtitle, tone: _tone = "sim", className = "", children }) {
  return (
    <div className={cn("ed-inset", className)}>
      {label ? <p className="ed-kicker">{label}</p> : null}
      {value ? <p className="ed-hero-number">{value}</p> : null}
      {subtitle ? (
        <Caption className="block mt-1 relative opacity-90">
          {subtitle}
        </Caption>
      ) : null}
      {children ? <div className="relative mt-2 ed-stack-sm">{children}</div> : null}
    </div>
  );
}

export default ToolAnswerHero;
