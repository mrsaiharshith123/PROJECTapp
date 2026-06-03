import { createElement } from "react";
import { cn } from "../utils/cn.js";

/**
 * @param {import('react').PropsWithChildren<{ className?: string, variant?: string, as?: string } & Record<string, unknown>>} props
 */
export function Card({ children, className = "", variant = "default", as: Tag = "div", ...props }) {
  const v =
    variant === "hero"
      ? "ct-card-hero"
      : variant === "glow"
        ? "ct-card ct-card-glow"
        : variant === "flat"
          ? "ct-card ct-card-flat"
          : "ct-card";
  return createElement(Tag, { className: cn(v, className), ...props }, children);
}

export default Card;
