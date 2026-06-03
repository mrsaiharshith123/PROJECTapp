import { addMonths, format, parseISO } from "date-fns";

/** Shared fields for manual add, request link, and lender accept. */
export function buildLendingRecord({
  type,
  personName,
  totalAmount,
  dueDate,
  interestRate = 0,
  notes = "",
  relationshipTag = "Other",
  extra = /** @type {Record<string, unknown>} */ ({}),
}) {
  const amount = Math.max(0, Number(totalAmount) || 0);
  const due = String(dueDate || "").slice(0, 10);
  let end = extra.endDate;
  if (!end && due) {
    try {
      end = format(addMonths(parseISO(`${due}T12:00:00`), 12), "yyyy-MM-dd");
    } catch {
      end = due;
    }
  }
  return {
    type: type === "borrowed" ? "borrowed" : "lent",
    personName: String(personName || "").trim() || "Unknown",
    totalAmount: amount,
    principalAmount: amount,
    dueDate: due,
    startDate: extra.startDate || due,
    endDate: end || due,
    interestRate: Math.max(0, Math.min(60, Number(interestRate) || 0)),
    interestType: extra.interestType || "simple",
    repaymentFrequency: extra.repaymentFrequency || "monthly",
    repaymentType: extra.repaymentType || "monthly",
    relationshipTag,
    notes: String(notes || "").trim(),
    ...extra,
  };
}
