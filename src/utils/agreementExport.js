/** Download printable HTML loan agreement (local trust documentation only). */
export function downloadLendingAgreementHtml(lending, settings = {}) {
  const lender = lending.type === "lent" ? settings.displayName || "Lender" : lending.personName;
  const borrower = lending.type === "lent" ? lending.personName : settings.displayName || "Borrower";
  const principal = Number(lending.principalAmount ?? lending.totalAmount) || 0;
  const schedule = lending.repaymentSchedule || [];
  const scheduleRows = schedule
    .slice(0, 24)
    .map(
      (r) =>
        `<tr><td>${r.installmentNumber}</td><td>${escapeHtml(r.dueDate)}</td><td>₹${Number(r.totalPayment).toLocaleString()}</td><td>${r.paymentStatus}</td></tr>`
    )
    .join("");

  const custom = lending.agreementText?.trim();
  const body = custom
    ? `<pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(custom)}</pre>`
    : `
    <p>This informal loan agreement is recorded in CommitTrack on ${new Date().toLocaleDateString("en-IN")}. It is a private record only — not legal advice or enforceable counsel.</p>
    <h2>Parties</h2>
    <ul>
      <li><strong>Lender:</strong> ${escapeHtml(lender)}</li>
      <li><strong>Borrower:</strong> ${escapeHtml(borrower)}</li>
      <li><strong>Relationship:</strong> ${escapeHtml(lending.relationshipTag || "Other")}</li>
    </ul>
    <h2>Loan terms</h2>
    <ul>
      <li><strong>Principal:</strong> ₹${principal.toLocaleString()}</li>
      <li><strong>Interest rate:</strong> ${Number(lending.interestRate) || 0}% (${escapeHtml(lending.interestType || "simple")})</li>
      <li><strong>Total payable:</strong> ₹${Number(lending.totalPayable || principal).toLocaleString()}</li>
      <li><strong>Interest component:</strong> ₹${Number(lending.interestAmount || 0).toLocaleString()}</li>
      <li><strong>Repayment:</strong> ${escapeHtml(lending.repaymentFrequency || "monthly")} · ₹${Number(lending.expectedInstallment || 0).toLocaleString()} per installment</li>
      <li><strong>Period:</strong> ${escapeHtml(lending.startDate || "—")} to ${escapeHtml(lending.endDate || "—")}</li>
      <li><strong>Outstanding:</strong> ₹${Number(lending.remainingBalance ?? lending.remainingAmount).toLocaleString()}</li>
    </ul>
    ${
      scheduleRows
        ? `<h2>Repayment schedule (summary)</h2><table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:12px"><thead><tr><th>#</th><th>Due</th><th>Amount</th><th>Status</th></tr></thead><tbody>${scheduleRows}</tbody></table>`
        : ""
    }
    <h2>Clauses</h2>
    <ol>
      <li>Repayments are tracked locally in CommitTrack; no funds move through this app.</li>
      <li>Both parties agree to the schedule above in good faith.</li>
      <li>Late payments may affect trust scores shown in the app only.</li>
    </ol>
    <h2>Signatures</h2>
    <p>Lender: _________________________ &nbsp; Date: __________</p>
    <p>Borrower: ______________________ &nbsp; Date: __________</p>
    <h2>Witness (optional)</h2>
    <p>Witness: ________________________ &nbsp; Date: __________</p>
    ${
      lending.agreementAcceptedAt
        ? `<p><em>Marked accepted in CommitTrack: ${new Date(lending.agreementAcceptedAt).toLocaleString("en-IN")}</em></p>`
        : ""
    }
  `;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Loan agreement – ${escapeHtml(lending.personName)}</title>
  <style>body{font-family:system-ui,sans-serif;max-width:720px;margin:2rem auto;padding:0 1rem;color:#111;line-height:1.5} h1,h2{margin-top:1.25em}</style></head>
  <body><h1>Loan agreement</h1>${body}</body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `committrack-agreement-${lending.id}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
