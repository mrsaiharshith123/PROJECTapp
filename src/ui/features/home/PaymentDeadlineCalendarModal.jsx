import { useMemo, useState } from "react";
import { addMonths, subMonths } from "date-fns";
import { Modal, Button, Caption, Body, Badge } from "../../index.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import {
  buildMonthCalendarGrid,
  collectPaymentDeadlines,
  formatDeadlineHeading,
} from "../../../utils/paymentDeadlineCalendar.js";
import { formatInr } from "../../../constants/symbols.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { translateBillStatus } from "../../../i18n/domainLabels.js";

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/**
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function PaymentDeadlineCalendarModal({ open, onClose }) {
  const { t } = useTranslation();
  const { commitments, lendings, getEffectiveStatus, getEffectiveLendingStatus, todayStr } =
    usePerovo();
  const [viewMonth, setViewMonth] = useState(() => {
    if (todayStr) {
      const [y, m] = todayStr.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  });
  const [selectedYmd, setSelectedYmd] = useState(todayStr || null);

  const deadlinesByDate = useMemo(
    () => collectPaymentDeadlines(commitments, lendings, getEffectiveStatus, getEffectiveLendingStatus),
    [commitments, lendings, getEffectiveStatus, getEffectiveLendingStatus],
  );

  const grid = useMemo(() => buildMonthCalendarGrid(viewMonth), [viewMonth]);

  const monthDeadlines = useMemo(() => {
    let count = 0;
    for (const [ymd, items] of Object.entries(deadlinesByDate)) {
      if (ymd.startsWith(grid.monthKey)) count += items.length;
    }
    return count;
  }, [deadlinesByDate, grid.monthKey]);

  const selectedItems = selectedYmd ? deadlinesByDate[selectedYmd] || [] : [];

  if (!open) return null;

  return (
    <Modal title={t("calendar.title")} onClose={onClose}>
      <div className="ct-stack">
        <Caption className="block">{t("calendar.hint", { count: monthDeadlines })}</Caption>

        <div className="ct-pay-cal-panel ct-stack-sm">
          <div className="ct-row-between">
            <Button type="button" variant="ghost" size="sm" className="!w-auto" onClick={() => setViewMonth((m) => subMonths(m, 1))}>
              ←
            </Button>
            <Body className="font-semibold !text-sm">{grid.monthLabel}</Body>
            <Button type="button" variant="ghost" size="sm" className="!w-auto" onClick={() => setViewMonth((m) => addMonths(m, 1))}>
              →
            </Button>
          </div>

          <div className="ct-pay-cal-grid">
            {WEEKDAY_KEYS.map((d) => (
              <Caption key={d} className="text-center font-semibold !text-[10px]">
                {t(`calendar.week.${d}`)}
              </Caption>
            ))}
            {Array.from({ length: grid.leadingEmpty }).map((_, i) => (
              <span key={`pad-${i}`} aria-hidden />
            ))}
            {grid.days.map((cell) => {
              const items = deadlinesByDate[cell.ymd] || [];
              const hasDue = items.length > 0;
              const selected = selectedYmd === cell.ymd;
              const overdue = items.some((it) => it.status === "overdue");
              return (
                <button
                  key={cell.ymd}
                  type="button"
                  className={`ct-pay-cal-day${hasDue ? " ct-pay-cal-day-has-dues" : ""}${selected ? " ct-pay-cal-day-selected" : ""}${cell.isToday ? " ct-pay-cal-day-today" : ""}${overdue ? " ct-pay-cal-day-overdue" : ""}`}
                  onClick={() => setSelectedYmd(cell.ymd)}
                  aria-label={`${cell.dayNum}${hasDue ? `, ${items.length} due` : ""}`}
                >
                  <span>{cell.dayNum}</span>
                  {hasDue && <span className="ct-pay-cal-dot" aria-hidden />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="ct-pay-cal-panel ct-stack-sm">
          {selectedYmd ? (
            <>
              <Body className="font-semibold !text-sm">{formatDeadlineHeading(selectedYmd)}</Body>
              {selectedItems.length === 0 ? (
                <Caption>{t("calendar.noPayments")}</Caption>
              ) : (
                <ul className="ct-stack-sm">
                  {selectedItems.map((item) => (
                    <li key={`${item.kind}-${item.id}`} className="ct-stat-tile">
                      <div className="ct-row-between gap-2">
                        <div className="min-w-0">
                          <Body className="font-semibold truncate !text-sm">{item.name}</Body>
                          <Caption>
                            {item.kind === "lending" ? t("calendar.kind.lending") : t("calendar.kind.bill")}
                          </Caption>
                        </div>
                        <div className="shrink-0 text-right">
                          <Body className="font-semibold !text-sm">{formatInr(item.amount)}</Body>
                          <Badge tone={item.status === "overdue" ? "danger" : item.status === "pending" ? "warning" : "neutral"}>
                            {translateBillStatus(t, item.status)}
                          </Badge>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <Caption>{t("calendar.selectDate")}</Caption>
          )}
        </div>
      </div>
    </Modal>
  );
}
