import { cn } from "../utils/cn.js";

const V = {
  primary: "ct-btn ct-btn-primary",
  secondary: "ct-btn ct-btn-secondary",
  ghost: "ct-btn ct-btn-ghost",
  outline: "ct-btn ct-btn-outline",
  danger: "ct-btn ct-btn-danger",
  success: "ct-btn ct-btn-success",
  teal: "ct-btn ct-btn-teal",
};
const S = { sm: "ct-btn-sm", md: "ct-btn-md", lg: "ct-btn-lg" };

/**
 * @param {{ variant?: keyof typeof V, size?: keyof typeof S, className?: string, type?: 'button'|'submit'|'reset', children: import('react').ReactNode } & import('react').ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export function Button({ variant = "primary", size = "md", className = "", type = "button", children, ...props }) {
  return (
    <button type={type} className={cn(V[variant], S[size], className)} {...props}>
      {children}
    </button>
  );
}

export function Fab({ className = "", children, ...props }) {
  return (
    <button type="button" className={cn("ct-btn ct-fab", className)} {...props}>
      {children}
    </button>
  );
}

export default Button;
