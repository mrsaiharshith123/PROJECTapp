function partyNames(lending, settings = {}) {
  const isLent = lending.type === "lent";
  const borrower =
    lending.borrowerFullName ||
    (isLent ? lending.personName : settings.displayName) ||
    "Borrower";
  const lender =
    lending.lenderFullName ||
    (isLent ? settings.displayName : lending.personName) ||
    "Lender";
  return { borrower, lender };
}

/** @param {object} lending @param {object} [settings] */
export function buildReminderMessage(lending, settings = {}) {
  const { borrower, lender } = partyNames(lending, settings);
  const principal = Number(lending.principalAmount ?? lending.totalAmount) || 0;
  const remaining = Number(lending.remainingBalance ?? lending.remainingAmount) || 0;
  const due = lending.nextDueDate || lending.dueDate || lending.endDate || "soon";
  const amt = Number(lending.nextDueAmount ?? lending.expectedInstallment) || remaining;
  return (
    `Hi ${borrower}, friendly reminder: your payment of ₹${amt.toLocaleString("en-IN")} ` +
    `for our loan (₹${principal.toLocaleString("en-IN")}, ${lending.startDate || "recent"}) was due on ${due}. ` +
    `Outstanding: ₹${remaining.toLocaleString("en-IN")}. Please arrange payment soon. — ${lender}`
  );
}

/** @param {object} lending @param {object} [settings] */
export function buildFinalNoticeMessage(lending, settings = {}) {
  const { borrower, lender } = partyNames(lending, settings);
  const remaining = Number(lending.remainingBalance ?? lending.remainingAmount) || 0;
  const overdueDate = lending.repaymentSchedule?.find((r) => r.paymentStatus !== "paid")?.dueDate || lending.dueDate || "recently";
  return (
    `Dear ${borrower}, final notice before legal steps. Outstanding: ₹${remaining.toLocaleString("en-IN")} overdue since ${overdueDate}. ` +
    `Please settle within 7 days to avoid legal proceedings. Formal notice prepared under CPC Order XXXVII. — ${lender}`
  );
}

/** @param {string} phone @param {string} message */
export function buildWhatsAppLink(phone, message) {
  const digits = String(phone || "").replace(/\D/g, "");
  const normalized = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

/** @param {string} phone */
export function buildWhatsAppCallLink(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  const normalized = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${normalized}`;
}
