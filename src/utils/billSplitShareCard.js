import { openHtmlInNewTab } from "./lendingShareCard.js";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * @param {{ total: number, participants: { name: string, amount: number, share: number }[], sourceLabel?: string }} split
 * @param {string} [payerName]
 */
export function billSplitSharePlainText(split, payerName = "You") {
  const lines = (split.participants || []).map(
    (p) => `${p.name}: ₹${p.amount.toLocaleString("en-IN")} (${p.share}%)`,
  );
  return `Bill split — ${split.sourceLabel || "shared expense"}\nTotal: ₹${split.total.toLocaleString("en-IN")}\nPaid by: ${payerName}\n\n${lines.join("\n")}\n\nTrack on CommitTrack`;
}

export function generateBillSplitShareCardHtml(split, payerName = "You") {
  const rows = (split.participants || [])
    .map(
      (p) =>
        `<tr><td>${escapeHtml(p.name)}</td><td style="text-align:right">${p.share}%</td><td style="text-align:right">₹${p.amount.toLocaleString("en-IN")}</td></tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Bill split</title>
<style>body{font-family:system-ui,sans-serif;background:#f0f2f8;padding:24px} .card{max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:24px;border:1px solid #e2e8f0}
h1{font-size:1.25rem;margin:0 0 8px} table{width:100%;border-collapse:collapse;margin-top:16px} td,th{padding:8px;border-bottom:1px solid #e2e8f0;font-size:14px}
.footer{margin-top:16px;font-size:12px;color:#64748b}</style></head><body><div class="card">
<h1>Bill split</h1><p>${escapeHtml(split.sourceLabel || "Shared expense")} · Total ₹${split.total.toLocaleString("en-IN")}</p>
<p>Paid by <strong>${escapeHtml(payerName)}</strong></p>
<table><thead><tr><th>Person</th><th>Share</th><th>Owes</th></tr></thead><tbody>${rows}</tbody></table>
<p class="footer">CommitTrack — track repayments in one place.</p></div></body></html>`;

  return html;
}

export function openBillSplitShareCard(split, payerName) {
  openHtmlInNewTab(generateBillSplitShareCardHtml(split, payerName));
}
