import { cn } from "../utils/cn.js";

export function Surface({ children, className }) {
  return <div className={cn("ed-inset", className)}>{children}</div>;
}
