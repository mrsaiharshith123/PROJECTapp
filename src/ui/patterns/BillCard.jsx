import { useEffect, useRef } from "react";
import { differenceInMonths, format, parseISO } from "date-fns";
import { Card } from "../primitives/Card.jsx";
import { Button } from "../primitives/Button.jsx";
import { Caption } from "../primitives/Text.jsx";
import { CategoryChip } from "./CategoryChip.jsx";
import { PriorityBadge } from "./PriorityBadge.jsx";
import { BILL_STATUS_UI } from "../tokens/billStatus.js";
import { getBillDisplayName } from "../../utils/billDisplayName.js";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { translateBillStatus, translateRepeatType } from "../../i18n/domainLabels.js";
import { formatLocaleDate } from "../../i18n/formatLocale.js";
import { cn } from "../utils/cn.js";

const LOAN_CATEGORIES = new Set(["EMI", "Loan", "Credit Card", "BNPL"]);

function CommitmentProgress({ commitment, effectiveStatus = "pending" }) {
  if (!commitment?.startDate || !commitment?.endDate) return null;
  if (commitment.repeatType !== "monthly") return null;
  if (!LOAN_CATEGORIES.has(commitment.category)) return null;

  let start;
  let end;
  try {
    start = parseISO(commitment.startDate);
    end = parseISO(commitment.endDate);
  } catch {
    return null;
  }

  const today = new Date();
  const totalMonths = Math.max(1, differenceInMonths(end, start));
  const doneMonths = Math.min(totalMonths, Math.max(0, differenceInMonths(today, start)));
  const pct = Math.min(100, Math.round((doneMonths / totalMonths) * 100));

  let barClass = "ct-progress-bar";
  if (effectiveStatus === "overdue") barClass += " ct-progress-bar-danger";
  else if (pct >= 80) barClass += " ct-progress-bar-success";
  else if (pct >= 50) barClass += " ct-progress-bar-warning";

  return (
    <div className="ct-stack-sm" style={{ marginTop: "0.75rem" }}>
      <div className="ct-progress">
        <div className={`${barClass} ct-bar-animated`} style={{ width: `${pct}%` }} />
      </div>
      <Caption className="block">
        Month {doneMonths} of {totalMonths} · {pct}% complete · ends {format(end, "MMM yyyy")}
      </Caption>
    </div>
  );
}

function isDueWithinDays(dueDate, days) {
  if (!dueDate) return false;
  const due = new Date(`${dueDate}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diff = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= days;
}

function billCardVariant(eff, item, monthPaid) {
  if (monthPaid || eff === "paid") return "status-paid";
  if (eff === "overdue") return "status-overdue";
  if (eff === "upnext" || (eff === "pending" && isDueWithinDays(item.dueDate, 3))) return "status-due-soon";
  return "status-safe";
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
 *   health?: { score: number, band: string, insightId?: string | null, params?: object },
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
  health = null,
}) {
  const { t, locale } = useTranslation();
  const statusIconRef = useRef(null);
  const prevMonthPaid = useRef(monthPaid);

  useEffect(() => {
    if (monthPaid && !prevMonthPaid.current) {
      statusIconRef.current?.classList.add("ct-celebrate");
      const timer = setTimeout(() => statusIconRef.current?.classList.remove("ct-celebrate"), 600);
      prevMonthPaid.current = monthPaid;
      return () => clearTimeout(timer);
    }
    prevMonthPaid.current = monthPaid;
    return undefined;
  }, [monthPaid]);

  const { classes } = BILL_STATUS_UI[eff] || BILL_STATUS_UI.pending;
  const statusLabel = translateBillStatus(t, eff);
  const total = Number(item.amount ?? 0);
  const isHistory = variant === "history";
  const cardVariant = isHistory ? "status-paid" : billCardVariant(eff, item, monthPaid);
  const fmt = (dateStr) => formatLocaleDate(dateStr, locale);

  if (isHistory) {
    return (
      <Card variant={cardVariant} className={cn("ct-bill-card ct-bill-card-history", "ct-stack-sm", "ct-pressable")}>
        <button type="button" onClick={onOpen} className="ct-bill-card-head">
          <div className="min-w-0">
            <p className="ct-body-strong truncate">{getBillDisplayName(item)}</p>
            <p className="ct-caption">{t("bill.historyPaid", { date: fmt(item.dueDate) })}</p>
            {progress.totalCycles != null && progress.totalCycles > 0 && (
              <p className="ct-caption ct-text-accent mt-0.5">{progress.label}</p>
            )}
          </div>
          <span className="ct-status ct-status-success">{t("bill.status.paid")}</span>
        </button>
        <div className="ct-bill-card-actions">
          <Button variant="ghost" size="sm" type="button" onClick={onEdit}>
            {t("common.edit")}
          </Button>
          <Button variant="danger" size="sm" type="button" onClick={onDelete}>
            {t("common.delete")}
          </Button>
        </div>
      </Card>
    );
  }

  const dateParts = [];
  if (item.startDate) dateParts.push(t("bill.started", { date: fmt(item.startDate) }));
  if (item.endDate) dateParts.push(t("bill.ends", { date: fmt(item.endDate) }));
  else if (item.startDate) dateParts.push(t("bill.ongoing"));
  dateParts.push(t("bill.dueOn", { date: fmt(item.dueDate) }));

  return (
    <Card variant={cardVariant} className="ct-bill-card ct-stack ct-pressable">
      <button type="button" onClick={onOpen} className="ct-bill-card-head">
        <div className="ct-stack-sm min-w-0">
          <p className="ct-body-strong">{getBillDisplayName(item)}</p>
          <div className="ct-row" style={{ flexWrap: "wrap" }}>
            <CategoryChip categoryId={item.category} />
            <PriorityBadge priorityId={item.priority} />
            {item.repeatType !== "none" && (
              <span className="ct-chip-repeat">{translateRepeatType(t, item.repeatType)}</span>
            )}
            {health && (
              <span className={`ct-chip-health ct-chip-health-${health.band}`}>
                {t(`bill.health.${health.band}`)}
              </span>
            )}
          </div>
          {health?.insightId && (
            <p
              className={
                health.band === "stress" ? "ct-caption ct-text-warn font-medium" : "ct-caption text-[var(--ct-text-muted)]"
              }
            >
              {t(`insight.${health.insightId}`, health.params || {})}
            </p>
          )}
          <p className="ct-caption">
            {dateParts.join(" · ")}
            {item.notes ? <span className="block mt-1">{item.notes}</span> : null}
          </p>
          {progress.totalCycles != null && progress.totalCycles > 0 && (
            <p className="ct-caption ct-text-accent">{progress.label}</p>
          )}
        </div>
        <div className="ct-bill-card-amount">
          <p className="ct-display ct-amount ct-numeral">
            {"\u20b9"}
            {total.toLocaleString()}
          </p>
          {partial && (
            <p className="ct-caption ct-amount-warn ct-numeral">
              {t("bill.dueNow", { amount: `\u20b9${cycleDue.toLocaleString("en-IN")}` })}
            </p>
          )}
          <span className={classes}>{statusLabel}</span>
        </div>
      </button>

      <CommitmentProgress commitment={item} effectiveStatus={eff} />

      {monthPaid && <p ref={statusIconRef} className="ct-bill-paid-banner ct-celebrate">{t("bill.paidBanner")}</p>}

      {(eff === "pending" || eff === "overdue") && (
        <div className="ct-bill-card-actions">
          <Button variant="success" size="sm" type="button" className="ct-bill-pay-btn" onClick={onPay}>
            {t("common.pay")} {"\u20b9"}
            {cycleDue.toLocaleString("en-IN")}
          </Button>
          <Button variant="secondary" size="sm" type="button" onClick={onEdit}>
            {t("common.edit")}
          </Button>
          <Button variant="danger" size="sm" type="button" onClick={onDelete}>
            {t("common.delete")}
          </Button>
        </div>
      )}
    </Card>
  );
}
