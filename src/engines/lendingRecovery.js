function formatFullDate(d = new Date()) {
  const day = d.getDate();
  const suffix =
    day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
  return `${day}${suffix} ${d.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`;
}

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

function todayYmdLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** @param {object} lending */
export function getOverdueInstallments(lending) {
  const today = todayYmdLocal();
  return (lending.repaymentSchedule || []).filter(
    (r) => r.paymentStatus !== "paid" && String(r.dueDate || "") < today
  );
}

/** @param {object[]} overdueInstallments */
export function computeOverdueTotal(overdueInstallments) {
  return (overdueInstallments || []).reduce((s, r) => s + (Number(r.totalPayment) || 0), 0);
}

function daysBetweenYmd(fromYmd, toYmd) {
  const a = new Date(`${fromYmd}T12:00:00`);
  const b = new Date(`${toYmd}T12:00:00`);
  return Math.floor((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

/** @param {object} lending */
export function daysSinceOldestOverdue(lending) {
  const overdue = getOverdueInstallments(lending);
  if (!overdue.length) return 0;
  const oldest = overdue.map((r) => r.dueDate).sort()[0];
  return Math.max(0, daysBetweenYmd(oldest, todayYmdLocal()));
}

/** @param {object} lending */
export function isInDefault(lending) {
  return daysSinceOldestOverdue(lending) > 7;
}

/** @param {object} lending @param {object} [settings] */
export function buildDefaultNoticeText(lending, settings = {}) {
  const { borrower, lender } = partyNames(lending, settings);
  const principal = Number(lending.principalAmount ?? lending.totalAmount) || 0;
  const remaining = Number(lending.remainingBalance ?? lending.remainingAmount) || 0;
  const overdue = getOverdueInstallments(lending);
  const overdueTotal = computeOverdueTotal(overdue);
  const city = lending.agreementCity || "India";
  const agreementDate = lending.startDate || formatFullDate(new Date());

  return [
    "NOTICE FOR PAYMENT OF OUTSTANDING LOAN",
    "",
    `Date: ${formatFullDate(new Date())}`,
    "",
    `To: ${borrower}`,
    `From: ${lender}`,
    "",
    `Reference: Loan agreement dated ${agreementDate} for principal ₹${principal.toLocaleString("en-IN")}.`,
    "",
    `You have ${overdue.length} overdue installment(s) totalling ₹${overdueTotal.toLocaleString("en-IN")}.`,
    `Total outstanding balance: ₹${remaining.toLocaleString("en-IN")}.`,
    "",
    `You are called upon to pay ₹${remaining.toLocaleString("en-IN")} within 15 days of receipt of this notice.`,
    "",
    "Recovery options:",
    "1. Send via registered post + WhatsApp for evidence record.",
    "2. File summary suit under Order XXXVII CPC in Civil Court of " + city + ".",
    "3. Approach Lok Adalat for free, quick, legally binding settlement.",
    "4. File Section 420 IPC complaint if fraud is involved. Consult a qualified advocate before proceeding.",
    "",
    "Lender signature:",
    lender,
    "",
    "Date: _________________",
  ].join("\n");
}
