import { cn } from "../utils/cn.js";
import { Caption } from "../primitives/Text.jsx";

const GLOW_CLASS = {
  sim: "",
  wealth: "teal",
  survival: "amber",
  lending: "",
  pressure: "",
};

/**
 * Shared hero block for calculator / tool result summaries.
 * @param {{ label?: string, value?: string, subtitle?: string, tone?: "sim"|"wealth"|"survival"|"lending"|"pressure", className?: string, children?: import('react').ReactNode }} props
 */
export function ToolAnswerHero({ label, value, subtitle, tone = "sim", className = "", children }) {
  return (
    <div className={cn("ct-hero-card", tone, "ct-tool-answer-hero", className)}>
      <div className={cn("ct-hero-glow", GLOW_CLASS[tone])} aria-hidden />
      {label ? <p className="ct-hero-label">{label}</p> : null}
      {value ? <p className="ct-hero-number">{value}</p> : null}
      {subtitle ? (
        <Caption className="block mt-1 relative opacity-90">
          {subtitle}
        </Caption>
      ) : null}
      {children ? <div className="relative mt-2 ct-stack-sm">{children}</div> : null}
    </div>
  );
}

export default ToolAnswerHero;
