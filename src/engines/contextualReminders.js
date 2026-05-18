import { differenceInCalendarDays, parseISO } from "date-fns";
import {
  buildCommitmentReminders,
  buildLendingReminders,
  buildLumpyBillHorizonReminders,
} from "./reminders.js";
import { freeMoneyAfterBurden } from "./pressureScore.js";
import { combinedMonthlyIncome } from "../utils/combinedIncome.js";

/**
 * Enrich reminder messages with amount + free-cash context (feeds in-app + OS notifications).
 */
export function buildContextualReminderFeed({
  commitments,
  lendings,
  settings,
  getEffectiveStatus,
  getEffectiveLendingStatus,
  todayStr,
}) {
  const income = combinedMonthlyIncome(settings);
  const cash = freeMoneyAfterBurden(commitments, income, getEffectiveStatus);

  const base = [
    ...buildCommitmentReminders(commitments, getEffectiveStatus, todayStr),
    ...buildLendingReminders(lendings, todayStr, getEffectiveLendingStatus),
    ...buildLumpyBillHorizonReminders(commitments, getEffectiveStatus, todayStr),
  ];

  return base.map((r) => {
    const amt = Math.max(0, Number(r.amount) || 0);
    let daysUntil = null;
    try {
      if (r.dueDate) {
        daysUntil = differenceInCalendarDays(parseISO(`${r.dueDate}T12:00:00`), parseISO(`${todayStr}T12:00:00`));
      }
    } catch {
      /* ignore */
    }

    const afterPay = Math.round(cash.freeMoney - amt);
    let detail = "";
    if (amt > 0 && daysUntil != null && daysUntil >= 0) {
      detail = ` ₹${amt.toLocaleString("en-IN")} due`;
      if (daysUntil === 0) detail += " today";
      else if (daysUntil <= 7) detail += ` in ${daysUntil}d`;
      if (income > 0) {
        detail += afterPay >= 0 ? ` · ~₹${afterPay.toLocaleString("en-IN")} left after` : " · may exceed free cash";
      }
    }

    const title =
      r.urgency === "critical" ? "CommitTrack — overdue" : "CommitTrack reminder";

    return {
      ...r,
      title,
      message: `${r.message}${detail}`,
      osBody: `${r.name}:${detail || ` ₹${amt.toLocaleString("en-IN")}`}`.trim(),
    };
  });
}
