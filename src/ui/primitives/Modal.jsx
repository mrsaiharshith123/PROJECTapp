import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "../utils/cn.js";
import { Heading } from "./Text.jsx";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { useFocusTrap } from "../hooks/useFocusTrap.js";

/**
 * @param {{ title?: string, children: import('react').ReactNode, onClose: () => void, footer?: import('react').ReactNode, fullScreen?: boolean, sheet?: boolean, darkSheet?: boolean }} props
 */
export function Modal({ title, children, onClose, footer, fullScreen = false, sheet = false, darkSheet = false }) {
  const { t } = useTranslation();
  const panelRef = useFocusTrap(true);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const panel = (
    <div
      className={cn(
        "ed-modal-overlay",
        fullScreen && "ed-modal-overlay--fullscreen",
        sheet && "ed-modal-overlay--sheet",
      )}
      role="dialog"
      aria-modal="true"
    >
      <button type="button" className="ed-modal-backdrop" aria-label={t("common.close")} onClick={onClose} />
      <div
        ref={panelRef}
        className={cn(
          "ed-modal-panel",
          sheet ? "ed-modal-panel--sheet ed-animate-sheet-up" : "ed-animate-scale-in",
          sheet && darkSheet && "ed-modal-panel--sheet-dark",
          fullScreen && "ed-modal-panel--fullscreen",
        )}
      >
        {sheet ? <div className="ed-sheet-handle" aria-hidden /> : null}
        {title && (
          <div className="ed-modal-header">
            <Heading level={2}>{title}</Heading>
            <button type="button" onClick={onClose} className="ed-btn ed-btn-ghost ed-btn-sm" aria-label={t("common.close")}>
              ×
            </button>
          </div>
        )}
        <div className={cn("overflow-y-auto flex-1", fullScreen ? "ed-modal-body--fullscreen" : "px-5 py-4")}>
          {children}
        </div>
        {footer && <div className="ed-modal-footer">{footer}</div>}
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(panel, document.body);
  }

  return panel;
}

export default Modal;
