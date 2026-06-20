import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "../utils/cn.js";
import { Heading } from "./Text.jsx";

/**
 * @param {{ title?: string, children: import('react').ReactNode, onClose: () => void, footer?: import('react').ReactNode, fullScreen?: boolean, sheet?: boolean }} props
 */
export function Modal({ title, children, onClose, footer, fullScreen = false, sheet = false }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const panel = (
    <div
      className={cn(
        "ct-modal-overlay",
        fullScreen && "ct-modal-overlay--fullscreen",
        sheet && "ct-modal-overlay--sheet",
      )}
      role="dialog"
      aria-modal="true"
    >
      <button type="button" className="ct-modal-backdrop" aria-label="Close" onClick={onClose} />
      <div
        className={cn(
          "ct-modal-panel",
          sheet ? "ct-modal-panel--sheet ct-animate-sheet-up" : "ct-animate-scale-in",
          fullScreen && "ct-modal-panel--fullscreen",
        )}
      >
        {sheet ? <div className="ct-sheet-handle" aria-hidden /> : null}
        {title && (
          <div className="ct-row-between px-5 py-4 border-b border-white/10 shrink-0">
            <Heading level={2}>{title}</Heading>
            <button type="button" onClick={onClose} className="ct-btn ct-btn-ghost ct-btn-sm">
              ×
            </button>
          </div>
        )}
        <div className={cn("overflow-y-auto flex-1", fullScreen ? "ct-modal-body--fullscreen" : "px-5 py-4")}>
          {children}
        </div>
        {footer && <div className="px-5 py-4 border-t border-white/10 shrink-0">{footer}</div>}
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(panel, document.body);
  }

  return panel;
}

export default Modal;
