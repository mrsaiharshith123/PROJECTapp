import { parseISO } from "date-fns";

/**
 * Chronological lending events for detail UI.
 * @returns {{ id: string, type: string, message: string, createdAt: number, metadata?: object }[]}
 */
export function buildLendingTimeline(lending) {
  const events = [];
  const push = (type, message, createdAt, metadata = {}) => {
    events.push({
      id: `${type}-${createdAt}-${events.length}`,
      type,
      message,
      createdAt: typeof createdAt === "number" ? createdAt : Date.now(),
      metadata,
    });
  };

  if (lending.agreementAcceptedAt) {
    push("agreement", "Agreement accepted", lending.agreementAcceptedAt);
  } else if (lending.createdAt) {
    push("agreement", "Loan record created", lending.createdAt);
  }

  if (lending.startDate) {
    push("start", `Loan started · ${lending.startDate}`, lending.createdAt || Date.now());
  }

  for (const p of lending.payments || []) {
    const amt = Number(p.amount) || 0;
    if (amt <= 0) continue;
    const label = p.onTime === false ? "Late payment received" : "Payment received";
    push("payment", `₹${amt.toLocaleString()} · ${label}`, parseDateMs(p.date), {
      amount: amt,
      principalPortion: p.principalPortion,
      interestPortion: p.interestPortion,
    });
  }

  for (const row of lending.repaymentSchedule || []) {
    if (row.paymentStatus === "overdue" && row.lateDays > 0) {
      push(
        "overdue",
        `Installment #${row.installmentNumber} · ${row.lateDays} day(s) overdue`,
        Date.now(),
        { installmentNumber: row.installmentNumber }
      );
    }
  }

  if (lending.disputeStatus === "open") {
    push("dispute", "Dispute opened", lending.updatedAt || Date.now());
  }

  const rem = Number(lending.remainingBalance ?? lending.remainingAmount) || 0;
  if (rem <= 0 && (lending.payments || []).length > 0) {
    push("closed", "Loan settled", lending.updatedAt || Date.now());
  }

  return events.sort((a, b) => a.createdAt - b.createdAt);
}

function parseDateMs(dateStr) {
  try {
    return parseISO(`${String(dateStr).slice(0, 10)}T12:00:00`).getTime();
  } catch {
    return Date.now();
  }
}
