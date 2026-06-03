import { createElement } from "react";
import { cn } from "../utils/cn.js";

const MAP = {
  h1: "ct-h1 ct-display",
  h2: "ct-h2",
  eyebrow: "ct-eyebrow",
  body: "ct-body",
  caption: "ct-caption",
  greeting: "ct-greeting",
};

/**
 * @param {import('react').PropsWithChildren<{ as?: string, variant?: keyof typeof MAP, className?: string } & Record<string, unknown>>} props
 */
export function Text({ as: Tag = "p", variant = "body", className = "", children, ...props }) {
  return createElement(Tag, { className: cn(MAP[variant] || MAP.body, className), ...props }, children);
}

export const Heading = ({ level = 2, className = "", children, ...props }) => (
  <Text as={`h${level}`} variant={level === 1 ? "h1" : "h2"} className={className} {...props}>
    {children}
  </Text>
);

export const Eyebrow = (props) => <Text as="p" variant="eyebrow" {...props} />;
export const Body = (props) => <Text as="p" variant="body" {...props} />;
export const Caption = (props) => <Text as="p" variant="caption" {...props} />;
