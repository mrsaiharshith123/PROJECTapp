import { formatInr } from "../constants/symbols.js";

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

/** @param {object} lending @param {object} [settings] */
export function buildAgreementShareMessage(lending, settings = {}) {
  const amount = formatInr(Number(lending.principalAmount ?? lending.totalAmount) || 0);
  const lender = lending.lenderFullName || settings?.displayName || "Your lender";
  const purpose = lending.loanPurpose || "personal loan";
  const name = lending.borrowerFullName || lending.personName || "there";
  return `Hi ${name}, ${lender} has created a loan agreement for ${amount} (${purpose}) on Perovo. Please review the terms and confirm. Your repayment schedule and due dates are included. — Managed via Perovo`;
}

/** @param {object} lending @param {object} [settings] */
export function buildDealConfirmedMessage(lending, settings = {}) {
  const amount = formatInr(Number(lending.principalAmount ?? lending.totalAmount) || 0);
  const firstDue = (lending.repaymentSchedule || [])[0]?.dueDate || "soon";
  const name = lending.borrowerFullName || lending.personName || "there";
  const lender = lending.lenderFullName || settings?.displayName || "Lender";
  return `Hi ${name}, our loan agreement for ${amount} is confirmed. First payment due: ${firstDue}. You can track this in Perovo. — ${lender}`;
}

/** @param {object} lending @param {object} [settings] @param {number} escalationLevel */
export function buildEscalationMessage(lending, settings = {}, escalationLevel = 1) {
  const amount = formatInr(Number(lending.remainingAmount ?? lending.remainingBalance ?? lending.principalAmount) || 0);
  const name = lending.borrowerFullName || lending.personName || "the borrower";
  const lender = lending.lenderFullName || settings?.displayName || "the lender";
  if (escalationLevel === 1) return buildReminderMessage(lending, settings);
  if (escalationLevel === 2) return buildFinalNoticeMessage(lending, settings);
  return `FINAL NOTICE: Dear ${name}, this is your last reminder. Outstanding: ${amount}. A formal legal notice under CPC Order XXXVII has been prepared. Immediate payment is required. — ${lender} via Perovo`;
}
