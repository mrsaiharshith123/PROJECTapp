import { cn } from "../utils/cn.js";

const TONE_CLASS = {
  success: "ct-status ct-status-success",
  warning: "ct-status ct-status-warning",
  danger: "ct-status ct-status-danger",
  info: "ct-status ct-status-info",
  teal: "ct-badge ct-badge-teal",
  coral: "ct-badge ct-badge-coral",
  neutral: "ct-status ct-status-neutral",
};

/**
 * @param {{ children: import('react').ReactNode, className?: string, tone?: string }} props
 */
export function Badge({ children, className = "", tone }) {
  const toneClass = tone ? TONE_CLASS[tone] : TONE_CLASS.neutral;
  return <span className={cn(toneClass, className)}>{children}</span>;
}

export default Badge;
