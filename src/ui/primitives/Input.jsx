import { cn } from "../utils/cn.js";

export function inputClassName(className = "") {
  return cn("ct-input", className);
}

export function fieldInputClass(hasError = false, className = "") {
  return cn("ct-input", hasError && "border-red-500/50", className);
}

export function Input(props) {
  return <input className={inputClassName(props.className)} {...props} />;
}

export function Select({ className = "", children, ...props }) {
  return (
    <select className={cn("ct-select", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className = "", ...props }) {
  return <textarea className={cn("ct-textarea ct-input", className)} {...props} />;
}

export default Input;
