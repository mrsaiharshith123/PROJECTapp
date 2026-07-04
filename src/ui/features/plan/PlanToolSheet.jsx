import { Modal } from "../../primitives/Modal.jsx";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { cn } from "../../utils/cn.js";

/**
 * Bottom sheet wrapper for Plan tab calculators.
 * @param {{ open: boolean, onClose: () => void, icon?: string, title: string, accent?: string, children: import('react').ReactNode }} props
 */
export default function PlanToolSheet({ open, onClose, icon, title, accent = "indigo", children }) {
  if (!open) return null;

  return (
    <Modal onClose={onClose} sheet>
      <div className="ed-inset">
        <div className="ed-plan-tool-sheet-head">
          {icon ? (
            <span className={cn("ed-icon-tile ed-icon-tile", accent)} aria-hidden>
              <CtIcon name={icon} size={20} />
            </span>
          ) : null}
          <h2 className="ed-body-strong">{title}</h2>
        </div>
        <div className="ed-plan-tool-sheet-body">{children}</div>
      </div>
    </Modal>
  );
}
