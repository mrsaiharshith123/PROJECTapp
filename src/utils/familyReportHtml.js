function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const TIER_COLORS = {
  thriving: "#059669",
  steady: "#2563eb",
  watch: "#d97706",
  fragile: "#dc2626",
};

/** @param {ReturnType<import('../engines/familyMonthlyReport.js').buildFamilyMonthlyReport>} report */
export function generateFamilyReportHtml(report) {
  const tier = report.stabilityTier || "steady";
  const tierColor = TIER_COLORS[tier] || TIER_COLORS.steady;
  const arrow =
    report.pressureDirection === "down" ? "↓ improved" : report.pressureDirection === "up" ? "↑ worsened" : "→ stable";
  const topCat = report.topCategory
    ? `${escapeHtml(report.topCategory[0])} ₹${Number(report.topCategory[1]).toLocaleString("en-IN")}`
    : "—";
  const overdueLine =
    report.overdueCount > 0
      ? `${report.overdueCount} overdue`
      : "None ✓";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Family Report — ${escapeHtml(report.familyName)} — ${escapeHtml(report.month)}</title>
<style>
  @page { size: A4; margin: 2cm; }
  body { font-family: Georgia, "Times New Roman", serif; max-width: 18cm; margin: 0 auto; padding: 1.5cm; color: #111; line-height: 1.5; font-size: 12pt; }
  h1 { font-size: 15pt; margin-bottom: 0.25em; }
  .sub { font-size: 11pt; color: #444; margin-bottom: 1.5em; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 1em 0; }
  .cell { border: 1px solid #ddd; padding: 12px; border-radius: 6px; }
  .cell label { display: block; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.04em; color: #666; margin-bottom: 4px; }
  .cell strong { font-size: 14pt; }
  .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; color: #fff; font-size: 10pt; font-family: system-ui, sans-serif; background: ${tierColor}; }
  .row { margin: 0.5em 0; }
  .footer { margin-top: 2em; padding-top: 0.75em; border-top: 1px solid #ddd; font-size: 9pt; color: #555; text-align: center; }
</style>
</head>
<body>
<h1>Perovo · ${escapeHtml(report.familyName)}</h1>
<p class="sub">${escapeHtml(report.month)} Report</p>
<div class="grid">
  <div class="cell"><label>Combined Income</label><strong>₹${Number(report.income).toLocaleString("en-IN")}</strong></div>
  <div class="cell"><label>Monthly Obligations</label><strong>₹${Number(report.burden).toLocaleString("en-IN")}</strong></div>
  <div class="cell"><label>Free Cash</label><strong>₹${Number(report.freeCash).toLocaleString("en-IN")}</strong></div>
  <div class="cell"><label>Stability Score</label><strong>${report.stabilityScore}/100</strong></div>
</div>
<p class="row">Stability tier: <span class="badge">${escapeHtml(tier)}</span></p>
<p class="row">Pressure trend: ${escapeHtml(arrow)}${report.pressureDelta != null ? ` (${report.pressureDelta > 0 ? "+" : ""}${report.pressureDelta})` : ""}</p>
<p class="row">Paid on time: ${report.paidCount} of ${report.commitmentCount} commitments</p>
<p class="row">Overdue: ${overdueLine}</p>
<p class="row">Top spending category: ${topCat}</p>
<p class="row">Dependents tracked: ${report.dependents}</p>
<div class="footer">Perovo Family Financial OS · not financial advice</div>
</body>
</html>`;
}
