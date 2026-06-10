import { openHtmlInNewTab } from "./lendingShareCard.js";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatInr(n) {
  return `₹${Math.max(0, Number(n) || 0).toLocaleString("en-IN")}`;
}

/**
 * @param {{
 *   displayName?: string,
 *   lentTotal?: number,
 *   borrowedTotal?: number,
 *   lentOutstanding?: number,
 *   borrowedOutstanding?: number,
 *   trustScore?: number | null,
 *   activeDeals?: number,
 * }} data
 */
export function lendingProfileSharePlainText(data) {
  const name = data.displayName || "CommitTrack user";
  const trust = data.trustScore != null ? `${data.trustScore}/100` : "—";
  return [
    `${name} — Lending profile`,
    `Money lent (total): ${formatInr(data.lentTotal)} · outstanding ${formatInr(data.lentOutstanding)}`,
    `Money borrowed (total): ${formatInr(data.borrowedTotal)} · outstanding ${formatInr(data.borrowedOutstanding)}`,
    `Trust score: ${trust}`,
    `Active deals: ${data.activeDeals ?? 0}`,
    "— CommitTrack · private snapshot, no bank details",
  ].join("\n");
}

/** @param {Parameters<typeof lendingProfileSharePlainText>[0]} data */
export function generateLendingProfileShareCardHtml(data) {
  const name = escapeHtml(data.displayName || "CommitTrack user");
  const trust = data.trustScore != null ? `${data.trustScore}/100` : "—";

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Lending profile</title>
<style>body{font-family:system-ui,sans-serif;background:linear-gradient(135deg,#1a1033,#0d1f2d);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;margin:0}
.card{width:420px;max-width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:28px;color:#f0eff8}
h1{font-size:1.1rem;margin:0 0 4px;opacity:.85} h2{font-size:1.5rem;margin:0 0 18px}
.row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:14px}
.val{font-weight:700;color:#a5b4fc;text-align:right}.footer{margin-top:20px;font-size:11px;opacity:.6;text-align:center}</style></head>
<body><div class="card"><h1>${name}</h1><h2>Lending profile</h2>
<div class="row"><span>Total lent</span><span class="val">${formatInr(data.lentTotal)}</span></div>
<div class="row"><span>Still to recover</span><span class="val">${formatInr(data.lentOutstanding)}</span></div>
<div class="row"><span>Total borrowed</span><span class="val">${formatInr(data.borrowedTotal)}</span></div>
<div class="row"><span>Still to repay</span><span class="val">${formatInr(data.borrowedOutstanding)}</span></div>
<div class="row"><span>Trust score</span><span class="val">${trust}</span></div>
<div class="row"><span>Active deals</span><span class="val">${data.activeDeals ?? 0}</span></div>
<p class="footer">CommitTrack by Daloy Tech — share when asking for or offering a loan. No account numbers included.</p></div></body></html>`;
}

/** @param {Parameters<typeof lendingProfileSharePlainText>[0]} data */
export function openLendingProfileShareCard(data) {
  openHtmlInNewTab(generateLendingProfileShareCardHtml(data));
}
