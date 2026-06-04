import { Card } from "../primitives/Card.jsx";
import { Button } from "../primitives/Button.jsx";
import { CategoryChip } from "./CategoryChip.jsx";
import { PriorityBadge } from "./PriorityBadge.jsx";
import { BILL_STATUS_UI } from "../tokens/billStatus.js";
import { repeatTypeLabel } from "../../constants/repeatTypes.js";
import { getBillDisplayName } from "../../utils/billDisplayName.js";
import { cn } from "../utils/cn.js";

function formatDate(dateStr) {
  if (!dateStr) return "\u2014";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * @param {{
 *   item: object,
 *   effectiveStatus: string,
 *   cycleDue: number,
 *   partial: boolean,
 *   monthPaid: boolean,
 *   progress: { label?: string, totalCycles?: number },
 *   onOpen: () => void,
 *   onPay: () => void,
 *   onEdit: () => void,
 *   onDelete: () => void,
 *   variant?: "active" | "history",
 * }} props
 */
export function BillCard({
  item,
  effectiveStatus: eff,
  cycleDue,
  partial,
  monthPaid,
  progress,
  onOpen,
  onPay,
  onEdit,
  onDelete,
  variant = "active",
}) {
  const { label, classes } = BILL_STATUS_UI[eff] || BILL_STATUS_UI.pending;
  const isOverdue = eff === "overdue";
  const total = Number(item.amount ?? 0);
  const isHistory = variant === "history";

  if (isHistory) {
    return (
      <Card className={cn("ct-bill-card ct-bill-card-history", "ct-stack-sm")}>
        <button type="button" onClick={onOpen} className="ct-bill-card-head">
          <div className="min-w-0">
            <p className="ct-body-strong truncate">{getBillDisplayName(item)}</p>
            <p className="ct-caption">
              Paid {"\u00b7"} due {formatDate(item.dueDate)}
            </p>
            {progress.totalCycles != null && progress.totalCycles > 0 && (
              <p className="ct-caption ct-text-accent mt-0.5">{progress.label}</p>
            )}
          </div>
          <span className="ct-status ct-status-success">Paid</span>
        </button>
        <div className="ct-bill-card-actions">
          <Button variant="ghost" size="sm" type="button" onClick={onEdit}>
            Edit
          </Button>
          <Button variant="danger" size="sm" type="button" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("ct-bill-card ct-stack", isOverdue && "ct-bill-card-overdue")}>
      <button type="button" onClick={onOpen} className="ct-bill-card-head">
        <div className="ct-stack-sm min-w-0">
          <p className="ct-body-strong">{getBillDisplayName(item)}</p>
          <div className="ct-row" style={{ flexWrap: "wrap" }}>
            <CategoryChip categoryId={item.category} />
            <PriorityBadge priorityId={item.priority} />
            {item.repeatType !== "none" && (
              <span className="ct-chip-repeat">{repeatTypeLabel(item.repeatType)}</span>
            )}
          </div>
          <p className="ct-caption">
            {item.startDate ? `Started ${formatDate(item.startDate)}` : null}
            {item.startDate && item.endDate ? " \u2192 " : item.startDate ? " \u00b7 " : ""}
            {item.endDate ? `Ends ${formatDate(item.endDate)}` : item.startDate ? "Ongoing" : ""}
            {" \u00b7 "}Due {formatDate(item.dueDate)}
            {item.notes ? <span className="block mt-1">{item.notes}</span> : null}
          </p>
          {progress.totalCycles != null && progress.totalCycles > 0 && (
            <p className="ct-caption ct-text-accent">{progress.label}</p>
          )}
        </div>
        <div className="ct-bill-card-amount">
          <p className="ct-display ct-amount">
            {"\u20b9"}
            {total.toLocaleString()}
          </p>
          {partial && (
            <p className="ct-caption ct-amount-warn">
              Due now {"\u20b9"}
              {cycleDue.toLocaleString("en-IN")}
            </p>
          )}
          <span className={classes}>{label}</span>
        </div>
      </button>

      {monthPaid && (
        <p className="ct-bill-paid-banner">Paid for this month — unlocks when the next due date starts.</p>
      )}

      {(eff === "pending" || eff === "overdue") && (
        <div className="ct-bill-card-actions">
          <Button variant="primary" size="sm" type="button" className="ct-bill-pay-btn" onClick={onPay}>
            Pay {"\u20b9"}
            {cycleDue.toLocaleString("en-IN")}
          </Button>
          <Button variant="secondary" size="sm" type="button" onClick={onEdit}>
            Edit
          </Button>
          <Button variant="danger" size="sm" type="button" onClick={onDelete}>
            Delete
          </Button>
        </div>
      )}
    </Card>
  );
}
