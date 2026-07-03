import { cn } from "../utils/cn.js";

const V = {
  primary: "ed-btn ed-btn-primary",
  secondary: "ed-btn ed-btn-secondary",
  ghost: "ed-btn ed-btn-ghost",
  outline: "ed-btn ed-btn-secondary",
  danger: "ed-btn ed-btn-danger",
  success: "ed-btn ed-btn-primary",
  teal: "ed-btn ed-btn-secondary",
};
const S = { sm: "ed-btn-sm", md: "", lg: "ed-btn-block" };

/**
 * @param {{ variant?: keyof typeof V, size?: keyof typeof S, className?: string, type?: 'button'|'submit'|'reset', children: import('react').ReactNode } & import('react').ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export function Button({ variant = "primary", size = "md", className = "", type = "button", children, ...props }) {
  return (
    // eslint-disable-next-line react/button-has-type -- type prop defaults to button; callers may pass submit
    <button type={type} className={cn(V[variant], S[size], className)} {...props}>
      {children}
    </button>
  );
}

export default Button;
