import { createElement } from "react";
import { cn } from "../utils/cn.js";

const VARIANT_CLASS = {
  default: "ct-card",
  hero: "ct-card-hero",
  glow: "ct-card ct-card-glow",
  flat: "ct-card ct-card-flat",
  metric: "ct-card-metric",
  "module-tile": "ct-module-tile",
  "status-overdue": "ct-card ct-card-status ct-card-status-overdue",
  "status-due-soon": "ct-card ct-card-status ct-card-status-due-soon",
  "status-paid": "ct-card ct-card-status ct-card-status-paid",
  "status-safe": "ct-card ct-card-status ct-card-status-safe",
};

/**
 * @param {import('react').PropsWithChildren<{ className?: string, variant?: string, as?: string } & Record<string, unknown>>} props
 */
export function Card({ children, className = "", variant = "default", as: Tag = "div", ...props }) {
  const v = VARIANT_CLASS[variant] || VARIANT_CLASS.default;
  return createElement(Tag, { className: cn(v, className), ...props }, children);
}

export default Card;
