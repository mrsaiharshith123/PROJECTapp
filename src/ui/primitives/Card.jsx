import { createElement } from "react";
import { cn } from "../utils/cn.js";

const VARIANT_CLASS = {
  default: "ed-card",
  glass: "ed-card",
  hero: "ed-card",
  glow: "ed-card",
  flat: "ed-card",
  metric: "ed-metric",
  "module-tile": "ed-card",
  "status-overdue": "ed-card ed-card-overdue",
  "status-due-soon": "ed-card ed-card-due-soon",
  "status-paid": "ed-card ed-card-paid",
  "status-safe": "ed-card",
};

/**
 * @param {import('react').PropsWithChildren<{ className?: string, variant?: string, as?: string } & Record<string, unknown>>} props
 */
export function Card({ children, className = "", variant = "default", as: Tag = "div", ...props }) {
  const v = VARIANT_CLASS[variant] || VARIANT_CLASS.default;
  return createElement(Tag, { className: cn(v, className), ...props }, children);
}

export default Card;
