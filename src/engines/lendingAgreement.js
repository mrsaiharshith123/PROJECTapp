import { trustScoreForPerson, lendingTrustByPerson, trustSummaryLine } from "./lendingTrust.js";
import { sanitizeName } from "../utils/sanitize.js";
import { numberToWords } from "../utils/numberToWords.js";

function formatFullDate(d = new Date()) {
  const day = d.getDate();
  const suffix =
    day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
  return `${day}${suffix} ${d.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`;
}

function partyNames(lending, settings) {
  const isLent = lending.type === "lent";
  const borrower = sanitizeName(
    lending.borrowerFullName ||
      (isLent ? lending.personName : settings.displayName) ||
      "Borrower",
  );
  const lender = sanitizeName(
    lending.lenderFullName ||
      (isLent ? settings.displayName : lending.personName) ||
      "Lender",
  );
  return { borrower, lender };
}

/** Court-structured promissory note text (India). */
export function buildPromissoryNoteText(lending, settings = {}) {
  const { borrower, lender } = partyNames(lending, settings);
  const principal = Number(lending.principalAmount ?? lending.totalAmount) || 0;
  const rate = Number(lending.interestRate) || 0;
  const interestType = lending.interestType || "simple";
  const city = lending.agreementCity || "India";
  const dateStr = formatFullDate(new Date());
  const penalty = Number(lending.penaltyRatePerMonth) || 2;
  const purpose = lending.loanPurpose || lending.notes || lending.purpose || "Personal requirement";
  const schedule = lending.repaymentSchedule || [];
  const installmentAmt = Number(lending.expectedInstallment) || 0;
  const freq = lending.repaymentFrequency || lending.repaymentType || "monthly";

  const scheduleLines =
    schedule.length > 0
      ? schedule
          .map(
            (r) =>
              `  ${r.installmentNumber}. ${r.dueDate} — ₹${Number(r.totalPayment).toLocaleString("en-IN")} (${r.paymentStatus || "pending"})`
          )
          .join("\n")
      : `  Lump sum by ${lending.endDate || lending.dueDate || "agreed date"} — ₹${principal.toLocaleString("en-IN")}`;

  const lines = [
    "PROMISSORY NOTE",
    "",
    `Date: ${city}, ${dateStr}`,
    "",
    `For value received, I/We ${borrower}, residing at ${lending.borrowerAddress || "[borrower address]"} (hereinafter "the Borrower") promise to pay ${lender}, residing at ${lending.lenderAddress || "[lender address]"} (hereinafter "the Holder/Lender") or order, the sum of Rupees ${numberToWords(principal)} only (₹${principal.toLocaleString("en-IN")}) with interest at ${rate}% per annum (${interestType}) on the unpaid balance.`,
    "",
    "--- LOAN DETAILS ---",
    `Principal (figures): ₹${principal.toLocaleString("en-IN")}`,
    `Principal (words): ${numberToWords(principal)} Rupees only`,
    `Date of advance: ${lending.startDate || dateStr}`,
    `Purpose: ${purpose}`,
    `Repayment mode: ${freq === "lumpsum" ? `Lump sum by ${lending.endDate || lending.dueDate}` : `${freq} installments of ₹${installmentAmt.toLocaleString("en-IN")}`}`,
    `Final repayment date: ${lending.endDate || lending.dueDate || "As per schedule"}`,
    `Penalty on default: ${penalty}% per month on outstanding balance`,
    "",
    "--- REPAYMENT SCHEDULE ---",
    scheduleLines,
    "",
    "--- IDENTIFICATION ---",
    lending.idProofType && lending.idProofLast4
      ? `Borrower ID proof: ${lending.idProofType} ending ${lending.idProofLast4}`
      : "Borrower ID proof: To be verified at execution",
    "",
    "--- DEFAULT CONSEQUENCES ---",
    "In the event of non-payment of any installment on its due date, the entire outstanding principal and accrued interest shall become immediately due and payable at the option of the Lender. The Lender shall be entitled to initiate recovery proceedings including but not limited to: (a) filing a summary suit under Order XXXVII of the Code of Civil Procedure 1908; (b) lodging a complaint under the Indian Contract Act 1872; (c) any other legal remedy available under the laws of India.",
  ];

  if (lending.arbitrationClause !== false) {
    lines.push(
      "",
      "--- ARBITRATION ---",
      `Any dispute arising out of or in connection with this agreement shall be referred to arbitration in accordance with the Arbitration and Conciliation Act 1996. The seat of arbitration shall be ${city}. The arbitration shall be conducted by a sole arbitrator agreed upon by both parties.`
    );
  }

  lines.push(
    "",
    "--- GOVERNING LAW ---",
    `This agreement is governed by the laws of India. Jurisdiction for disputes shall be the courts of ${city}.`,
    "",
    "--- SIGNATURES ---",
    `Borrower: ${borrower}`,
    lending.borrowerConfirmedAt || lending.esignStatus === "completed"
      ? `Confirmed: ${lending.borrowerConfirmedAt || lending.esignCompletedAt || "Aadhaar eSign completed"}`
      : "Signature: _________________________   Date: __________",
    "",
    `Lender/Holder: ${lender}`,
    lending.lenderConfirmedAt
      ? `Confirmed: ${lending.lenderConfirmedAt}${lending.lenderConfirmationRef ? ` (Ref: ${lending.lenderConfirmationRef})` : ""}`
      : "Signature: _________________________   Date: __________"
  );

  if (lending.witness1Name) {
    lines.push("", `Witness: ${lending.witness1Name}${lending.witness1Phone ? ` · Phone: ${lending.witness1Phone}` : ""}`);
  } else {
    lines.push("", "Witness: _________________________   Phone: __________");
  }

  if (lending.collateralDescription || lending.collateral) {
    lines.push("", "--- SECURITY / COLLATERAL ---", lending.collateralDescription || lending.collateral);
  }

  lines.push(
    "",
    "--- STAMP DUTY NOTICE ---",
    "Note: This promissory note requires applicable stamp duty under the Indian Stamp Act 1899 for enforceability in court. Print on stamp paper of appropriate denomination for your state, or pay stamp duty + penalty at the Sub-Registrar's office if not stamped at execution.",
    "",
    "--- GENERATION METADATA ---",
    `Generated via Perovo on ${new Date().toLocaleString("en-IN")}. Perovo is a financial tracking tool, not a legal service. For amounts above ₹1,00,000 or complex arrangements, consult a qualified advocate.`
  );

  return lines.join("\n");
}

/** @deprecated Prefer buildPromissoryNoteText — kept for offer share flow. */
export function buildAgreementText({
  borrowerName,
  lenderName,
  amount,
  interestRate,
  dueDate,
  collateral,
  purpose,
}) {
  return buildPromissoryNoteText(
    {
      type: "borrowed",
      personName: lenderName,
      borrowerFullName: borrowerName,
      lenderFullName: lenderName || "",
      principalAmount: amount,
      totalAmount: amount,
      interestRate,
      endDate: dueDate,
      dueDate,
      loanPurpose: purpose,
      collateralDescription: collateral,
      penaltyRatePerMonth: 2,
      arbitrationClause: true,
    },
    { displayName: lenderName }
  );
}

export function borrowerTrustSnapshot(lendings, borrowerName) {
  const rows = lendingTrustByPerson(lendings || []);
  const key = String(borrowerName || "").trim().toLowerCase();
  const row = rows.find((r) => r.personKey === key) || {
    personKey: key,
    displayName: borrowerName || "Borrower",
    totalDeals: 0,
    successfulRepayments: 0,
    delayedRepayments: 0,
    completedCycles: 0,
  };
  const total = row.successfulRepayments + row.delayedRepayments;
  let score = trustScoreForPerson(row);
  if (total === 0) {
    return {
      score,
      summary: "No past repayments recorded in Perovo yet. New borrower.",
      onTime: 0,
      late: 0,
    };
  }
  return {
    score,
    summary: trustSummaryLine(row),
    onTime: row.successfulRepayments,
    late: row.delayedRepayments,
  };
}

export function encodeOfferPayload(offer) {
  const json = JSON.stringify(offer);
  const b64 = btoa(
    encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
  );
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeOfferPayload(encoded) {
  if (!encoded) return null;
  try {
    let b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const json = decodeURIComponent(
      [...atob(b64)]
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const o = JSON.parse(json);
    if (!o || o.v !== 1) return null;
    return o;
  } catch {
    return null;
  }
}

/** Both parties signed and record is locked — terms cannot be changed until settled or mutual cancel. */
export function isAgreementFullyLocked(lending) {
  if (!lending) return false;
  const rem = Number(lending.remainingAmount ?? lending.remainingBalance) || 0;
  if (rem <= 0 || lending.status === "complete") return false;

  if (lending.lenderConfirmedAt && lending.borrowerConfirmedAt) return true;
  if (lending.esignStatus === "completed") return true;

  if (!lending.agreementLocked || !lending.agreementAccepted) return false;
  return true;
}

export function canEditLending(lending) {
  return !isAgreementFullyLocked(lending);
}

export function canDeleteLending(lending) {
  if (!lending?.agreementLocked) return true;
  const rem = Number(lending.remainingAmount) || 0;
  if (rem <= 0 || lending.status === "complete") return true;
  return Boolean(lending.mutualCancelBorrowerSign && lending.mutualCancelLenderSign);
}

export function repaymentModeLabel(lending) {
  const t = lending?.repaymentType || lending?.repaymentFrequency || "monthly";
  if (t === "lumpsum") return "Pay anytime (lump sum)";
  if (t === "monthly") return "Monthly installments";
  if (t === "weekly") return "Weekly installments";
  if (t === "biweekly") return "Biweekly installments";
  return "Flexible payments";
}

export function trustScoreLabel(score) {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Needs care";
}
