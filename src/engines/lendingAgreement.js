import { trustScoreForPerson, lendingTrustByPerson, trustSummaryLine } from "./lendingTrust.js";

export function buildAgreementText({
  borrowerName,
  lenderName,
  amount,
  interestRate,
  dueDate,
  collateral,
  purpose,
}) {
  const lines = [
    "PRIVATE LOAN REQUEST & AGREEMENT (CommitTrack)",
    "",
    `Borrower: ${borrowerName}`,
    `Lender: ${lenderName || "(name added when accepted)"}`,
    `Principal: \u20B9${Number(amount).toLocaleString("en-IN")}`,
    `Annual interest: ${interestRate}% (simple, for tracking only)`,
    `Repayment due date: ${dueDate}`,
  ];
  if (purpose) lines.push(`Purpose: ${purpose}`);
  if (collateral) {
    lines.push("");
    lines.push("Security / collateral offered:");
    lines.push(collateral);
  }
  lines.push(
    "",
    "The borrower agrees to repay on the terms above. The lender agrees to fund after reviewing the trust score and signing below.",
    "",
    "Both parties agree this document is stored locally in CommitTrack for personal records."
  );
  return lines.join("\n");
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
      summary: "No past repayments recorded in CommitTrack yet. New borrower.",
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

export function buildOfferShareUrl(offer, origin = "") {
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");
  const path = `${import.meta.env.BASE_URL || "/"}lend/offer`.replace(/\/{2,}/g, "/");
  const url = new URL(path, base);
  url.searchParams.set("d", encodeOfferPayload(offer));
  return url.toString();
}

export function canDeleteLending(lending) {
  if (!lending?.agreementLocked) return true;
  const rem = Number(lending.remainingAmount) || 0;
  if (rem <= 0 || lending.status === "complete") return true;
  return Boolean(lending.mutualCancelBorrowerSign && lending.mutualCancelLenderSign);
}

export function trustScoreLabel(score) {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Needs care";
}
