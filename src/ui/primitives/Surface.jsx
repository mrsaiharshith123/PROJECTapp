import { cn } from "../utils/cn.js";

export function Surface({ children, className = "" }) {
  return <div className={cn("ct-inset", className)}>{children}</div>;
}

export default Surface;
