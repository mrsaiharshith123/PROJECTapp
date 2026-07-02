import { repaymentModeLabel } from "../engines/lendingAgreement.js";

import { escapeHtml } from "./shareCardHtml.js";

export { openHtmlInNewTab } from "./shareCardHtml.js";

function formatInr(n) {
  return `₹${Math.max(0, Number(n) || 0).toLocaleString("en-IN")}`;
}

function partyNames(lending, settings = {}) {
  const lender =
    lending.type === "lent" ? settings.displayName?.trim() || "Lender" : lending.personName || "Lender";
  const borrower =
    lending.type === "lent" ? lending.personName || "Borrower" : settings.displayName?.trim() || "Borrower";
  return { lender, borrower };
}

function nextDueDate(lending) {
  const schedule = lending.repaymentSchedule || [];
  const next = schedule.find((r) => r.paymentStatus !== "paid" && r.paymentStatus !== "Paid");
  if (next?.dueDate) return String(next.dueDate).slice(0, 10);
  if (lending.endDate) return String(lending.endDate).slice(0, 10);
  if (lending.startDate) return String(lending.startDate).slice(0, 10);
  return "—";
}

/**
 * Plain-text one-liner for Web Share / clipboard.
 */
export function lendingSharePlainText(lending, settings = {}) {
  const { lender, borrower } = partyNames(lending, settings);
  const principal = Number(lending.principalAmount ?? lending.totalAmount) || 0;
  const outstanding = Number(lending.remainingBalance ?? lending.remainingAmount) || 0;
  const due = nextDueDate(lending);
  return `${borrower} ↔ ${lender} · ${formatInr(principal)} principal · ${formatInr(outstanding)} outstanding · next due ${due} · ${repaymentModeLabel(lending)}`;
}

/**
 * Self-contained 800×420 share card HTML (print / new tab).
 */
export function generateLendingShareCardHtml(lending, settings = {}) {
  const { lender, borrower } = partyNames(lending, settings);
  const principal = Number(lending.principalAmount ?? lending.totalAmount) || 0;
  const outstanding = Number(lending.remainingBalance ?? lending.remainingAmount) || 0;
  const due = nextDueDate(lending);
  const frequency = repaymentModeLabel(lending);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Perovo · Lending summary</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    background: #f0f2f8;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 16px;
  }
  .card {
    width: 800px;
    max-width: 100%;
    height: 420px;
    background: #ffffff;
    color: #0f172a;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    padding: 32px 36px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
  }
  .brand { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #7c5cff; }
  h1 { font-size: 22px; font-weight: 700; margin-top: 8px; }
  .sub { font-size: 13px; color: #64748b; margin-top: 4px; }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px 24px;
    margin-top: 20px;
  }
  .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; }
  .value { font-size: 17px; font-weight: 600; margin-top: 4px; }
  .value-lg { font-size: 26px; font-weight: 700; color: #7c5cff; }
  .qr {
    margin-top: 12px;
    width: 120px;
    height: 120px;
    border: 2px dashed #cbd5e1;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-size: 10px;
    color: #64748b;
    padding: 8px;
    line-height: 1.35;
  }
  .footer {
    border-top: 1px solid #e2e8f0;
    padding-top: 14px;
    font-size: 12px;
    color: #64748b;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
</style>
</head>
<body>
  <div class="card">
    <div>
      <div class="brand">Perovo</div>
      <h1>Lending summary</h1>
      <p class="sub">Private record — share only with people you trust</p>
      <div class="grid">
        <div>
          <div class="label">Lender</div>
          <div class="value">${escapeHtml(lender)}</div>
        </div>
        <div>
          <div class="label">Borrower</div>
          <div class="value">${escapeHtml(borrower)}</div>
        </div>
        <div>
          <div class="label">Principal</div>
          <div class="value value-lg">${formatInr(principal)}</div>
        </div>
        <div>
          <div class="label">Outstanding</div>
          <div class="value">${formatInr(outstanding)}</div>
        </div>
        <div>
          <div class="label">Repayment</div>
          <div class="value">${escapeHtml(frequency)}</div>
        </div>
        <div>
          <div class="label">Next due</div>
          <div class="value">${escapeHtml(due)}</div>
        </div>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:20px;">
      <div class="qr">Scan to track in Perovo</div>
      <div class="footer" style="border:none;padding:0;flex:1;">
        Tracked privately in Perovo · perovo.app
      </div>
    </div>
  </div>
</body>
</html>`;
}
