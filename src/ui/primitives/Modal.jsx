import { Heading } from "./Text.jsx";

/**
 * @param {{ title?: string, children: import('react').ReactNode, onClose: () => void, footer?: import('react').ReactNode }} props
 */
export function Modal({ title, children, onClose, footer }) {
  return (
    <div className="ct-modal-overlay" role="dialog" aria-modal="true">
      <button type="button" className="ct-modal-backdrop" aria-label="Close" onClick={onClose} />
      <div className="ct-modal-panel">
        {title && (
          <div className="ct-row-between px-5 py-4 border-b border-white/10 shrink-0">
            <Heading level={2}>{title}</Heading>
            <button type="button" onClick={onClose} className="ct-btn ct-btn-ghost ct-btn-sm">
              ×
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-5 py-4 flex-1">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-white/10 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;
