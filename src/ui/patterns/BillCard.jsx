import { memo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { differenceInMonths, parseISO } from "date-fns";
import { getBillDisplayName } from "../../utils/billDisplayName.js";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { usePrivacyAmount } from "../../hooks/usePrivacyAmount.js";
import {
  translateBillStatus,
  translateCategory,
  translatePriority,
  translateRepeatType,
} from "../../i18n/domainLabels.js";
import { formatLocaleDate } from "../../i18n/formatLocale.js";
import { BILL_STATUS_UI } from "../tokens/billStatus.js";
import { cn } from "../utils/cn.js";

const LOAN_CATEGORIES = new Set(["EMI", "Loan", "Credit Card", "BNPL"]);

function healthPillClass(band) {
  if (band === "stress") return "ed-pill ed-pill-red";
  if (band === "ok") return "ed-pill ed-pill-green";
  return "ed-pill ed-pill-gold";
}

function CommitmentProgress({ commitment, effectiveStatus = "pending", t, locale }) {
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

  let barClass = "ed-progress-bar";
  if (effectiveStatus === "overdue") barClass += " ed-progress-bar--danger";
  else if (pct >= 80) barClass += " ed-progress-bar--success";
  else if (pct >= 50) barClass += " ed-progress-bar--warning";

  return (
    <div className="ed-section" style={{ marginTop: 10, paddingTop: 0 }}>
      <div className="ed-progress">
        <div className={barClass} style={{ width: `${pct}%` }} />
      </div>
      <p className="ed-caption" style={{ marginTop: 6 }}>
        {t("bill.emiScheduleProgress", {
          done: doneMonths,
          total: totalMonths,
          pct,
          endDate: formatLocaleDate(commitment.endDate, locale),
        })}
      </p>
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
function BillCardImpl({
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
  const { formatAmount } = usePrivacyAmount();
  const navigate = useNavigate();
  const paidBannerRef = useRef(null);
  const prevMonthPaid = useRef(monthPaid);

  useEffect(() => {
    if (monthPaid && !prevMonthPaid.current) {
      paidBannerRef.current?.classList.add("ed-paid-flash");
      const timer = setTimeout(() => paidBannerRef.current?.classList.remove("ed-paid-flash"), 600);
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
  const isOverdue = eff === "overdue";

  if (isHistory) {
    return (
      <div className="ed-card ed-card-bill ed-card-paid">
        <button type="button" onClick={onOpen} className="ed-bill-head">
          <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
            <div className="ed-value" style={{ fontSize: 14 }}>
              {getBillDisplayName(item)}
            </div>
            <p className="ed-caption">{t("bill.historyPaid", { date: fmt(item.dueDate) })}</p>
            {progress.totalCycles != null && progress.totalCycles > 0 && (
              <p className="ed-caption ed-amount-gold" style={{ marginTop: 4 }}>
                {progress.label}
              </p>
            )}
          </div>
          <span className="ed-pill ed-pill-green">{t("bill.status.paid")}</span>
        </button>
        <div className="ed-actions-row ed-actions-row--two">
          <button type="button" className="ed-btn ed-btn-ghost ed-btn-sm" onClick={onEdit}>
            {t("common.edit")}
          </button>
          <button type="button" className="ed-btn ed-btn-danger ed-btn-sm" onClick={onDelete}>
            {t("common.delete")}
          </button>
        </div>
      </div>
    );
  }

  const dateParts = [];
  if (item.startDate) dateParts.push(t("bill.started", { date: fmt(item.startDate) }));
  if (item.endDate) dateParts.push(t("bill.ends", { date: fmt(item.endDate) }));
  else if (item.startDate) dateParts.push(t("bill.ongoing"));
  dateParts.push(t("bill.dueOn", { date: fmt(item.dueDate) }));

  return (
    <div
      className={cn(
        "ed-card ed-card-bill",
        cardVariant === "status-overdue" && "ed-card-overdue",
        cardVariant === "status-due-soon" && "ed-card-due-soon",
        cardVariant === "status-paid" && "ed-card-paid",
      )}
    >
      <button type="button" onClick={onOpen} className="ed-bill-head">
        <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
          <div className="ed-value" style={{ fontSize: 14 }}>
            {getBillDisplayName(item)}
          </div>
          <div className="ed-bill-pills">
            {item.category ? (
              <span className="ed-pill ed-pill-neutral">{translateCategory(t, item.category)}</span>
            ) : null}
            {item.priority ? (
              <span className="ed-pill ed-pill-amber">{translatePriority(t, item.priority)}</span>
            ) : null}
            {item.repeatType !== "none" ? (
              <span className="ed-pill ed-pill-neutral">{translateRepeatType(t, item.repeatType)}</span>
            ) : null}
            {health ? (
              <span className={healthPillClass(health.band)}>
                {health.band === "stress" && health.insightId === "bill-health-top-stress"
                  ? t("bill.health.topStressContributor")
                  : t(`bill.health.${health.band}`)}
              </span>
            ) : null}
          </div>
          {health?.insightId ? (
            <p className={cn("ed-caption", health.band === "stress" && "ed-amount-neg")} style={{ marginTop: 6 }}>
              {t(`insight.${health.insightId}`, health.params || {})}
            </p>
          ) : null}
          <p className="ed-caption" style={{ marginTop: 6 }}>
            {dateParts.join(" · ")}
            {item.notes ? <span style={{ display: "block", marginTop: 4 }}>{item.notes}</span> : null}
          </p>
          {progress.totalCycles != null && progress.totalCycles > 0 ? (
            <p className="ed-caption ed-amount-gold" style={{ marginTop: 4 }}>
              {progress.label}
            </p>
          ) : null}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div className={cn("ed-value", isOverdue && "ed-amount-neg")}>{formatAmount(total)}</div>
          {partial ? (
            <p className="ed-caption ed-amount-neg" style={{ marginTop: 4 }}>
              {t("bill.dueNow", { amount: formatAmount(cycleDue) })}
            </p>
          ) : null}
          <span className={classes} style={{ marginTop: 4, display: "inline-flex" }}>
            {statusLabel}
          </span>
        </div>
      </button>

      <CommitmentProgress commitment={item} effectiveStatus={eff} t={t} locale={locale} />

      {(item.category === "EMI" || item.category === "Loan") && eff !== "paid" ? (
        <button
          type="button"
          className="ed-btn-link"
          style={{ margin: "4px 14px 0", fontSize: 12 }}
          onClick={(e) => {
            e.stopPropagation();
            navigate("/you/tools?tool=loan");
          }}
        >
          {t("bill.loanPrepaySuggestion")}
        </button>
      ) : null}

      {monthPaid ? (
        <p ref={paidBannerRef} className="ed-paid-banner">
          {t("bill.paidBanner")}
        </p>
      ) : null}

      {(eff === "pending" || eff === "overdue") && (
        <div className="ed-actions-row">
          <button type="button" className="ed-btn ed-btn-primary ed-btn-sm" onClick={onPay}>
            {t("common.pay")} {formatAmount(cycleDue)}
          </button>
          <button type="button" className="ed-btn ed-btn-secondary ed-btn-sm" onClick={onEdit}>
            {t("common.edit")}
          </button>
          <button type="button" className="ed-btn ed-btn-danger ed-btn-sm" onClick={onDelete}>
            {t("common.delete")}
          </button>
        </div>
      )}
    </div>
  );
}

export const BillCard = memo(BillCardImpl);
