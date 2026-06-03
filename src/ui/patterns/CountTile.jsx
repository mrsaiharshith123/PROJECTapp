import { cn } from "../utils/cn.js";
import { insightToneClass } from "../tokens/severity.js";
import { Caption } from "../primitives/Text.jsx";

const VALUE = {
  neutral: "text-[var(--ct-text)]",
  success: "text-[var(--ct-success)]",
  warning: "text-[var(--ct-warning)]",
  danger: "text-[var(--ct-danger)]",
};

/**
 * @param {{ label: string, value: import('react').ReactNode, tone?: string, className?: string, onClick?: () => void }} props
 */
export function CountTile({ label, value, tone = "neutral", className = "", onClick }) {
  const body = (
    <>
      <p className={cn("text-lg font-bold", VALUE[tone] || VALUE.neutral)}>{value}</p>
      <Caption className="font-semibold mt-0.5 block">{label}</Caption>
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn("ct-metric text-left w-full", insightToneClass(tone === "neutral" ? "neutral" : tone), className)}
      >
        {body}
      </button>
    );
  }
  return (
    <div className={cn("ct-metric text-left", insightToneClass(tone === "neutral" ? "neutral" : tone), className)}>
      {body}
    </div>
  );
}
