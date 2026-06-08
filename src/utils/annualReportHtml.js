function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatInr(n) {
  return `₹${Math.round(Math.max(0, Number(n) || 0)).toLocaleString("en-IN")}`;
}

/**
 * @param {ReturnType<import('../engines/annualReport.js').buildAnnualReportData>} report
 */
export function generateAnnualReportHtml(report) {
  const stressRows = (report.topStressors?.top || report.topStressors || [])
    .slice(0, 3)
    .map(
      (s) =>
        `<tr><td>${escapeHtml(s.name)}</td><td>${formatInr(s.weight || s.monthly || 0)}</td></tr>`,
    )
    .join("");

  const luxury = report.subscriptionAudit?.classified?.filter(
    (r) => r.tag === "Luxury" || r.tag === "Optional",
  ) || [];
  const luxuryMonthly = luxury.reduce((s, r) => s + (r.monthly || 0), 0);
  const luxuryList = luxury
    .slice(0, 6)
    .map((r) => `<li>${escapeHtml(r.name)} — ${formatInr(r.monthly)}/mo (${escapeHtml(r.tag)})</li>`)
    .join("");

  const trendRows = (report.snapshotTrend || [])
    .map(
      (s) =>
        `<tr><td>${escapeHtml(s.month || s.monthKey || "—")}</td><td>${s.pressureScore ?? "—"}</td></tr>`,
    )
    .join("");

  const lifestyleLine = report.lifestyleInflation?.message
    ? `<p class="muted">${escapeHtml(report.lifestyleInflation.message)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>CommitTrack Annual Report</title>
<style>
  @page { size: A4; margin: 18mm; }
  body { font-family: system-ui, sans-serif; color: #0f172a; line-height: 1.5; max-width: 720px; margin: 0 auto; padding: 24px; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  h2 { font-size: 15px; margin-top: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  .muted { color: #64748b; font-size: 13px; }
  .scores { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0; }
  .score-box { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center; }
  .score-big { font-size: 28px; font-weight: 700; color: #7c5cff; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px; }
  th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; }
  th { background: #f8fafc; }
  footer { margin-top: 32px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <h1>CommitTrack · Annual Financial Health Report</h1>
  <p class="muted">${escapeHtml(report.userName)} · ${escapeHtml(report.reportYear)} · Generated ${escapeHtml(new Date(report.generatedAt).toLocaleDateString("en-IN"))}</p>

  <h2>Score summary</h2>
  <div class="scores">
    <div class="score-box"><div class="muted">Pressure</div><div class="score-big">${report.pressureScore}</div><div>${escapeHtml(report.pressureLabel)}</div></div>
    <div class="score-box"><div class="muted">Survival</div><div class="score-big">${report.survivalMonths ?? "—"}</div><div>months runway</div></div>
  </div>

  <h2>Commitments</h2>
  <ul>
    <li>Active bills tracked: <strong>${report.totalCommitments}</strong></li>
    <li>Monthly burden: <strong>${formatInr(report.totalMonthlyBurden)}</strong></li>
    <li>Free cash (est.): <strong>${formatInr(report.freeCash)}</strong></li>
  </ul>

  <h2>Top stress contributors</h2>
  <table><thead><tr><th>Bill</th><th>Monthly weight</th></tr></thead><tbody>${stressRows || "<tr><td colspan=2>—</td></tr>"}</tbody></table>

  <h2>Subscription audit</h2>
  <p>Luxury / optional subs: <strong>${formatInr(luxuryMonthly)}/mo</strong></p>
  <ul>${luxuryList || "<li>None flagged</li>"}</ul>

  <h2>Lifestyle inflation</h2>
  ${lifestyleLine || "<p class=\"muted\">Not enough history yet.</p>"}

  <h2>Monthly pressure trend</h2>
  <table><thead><tr><th>Month</th><th>Pressure</th></tr></thead><tbody>${trendRows || "<tr><td colspan=2>—</td></tr>"}</tbody></table>

  <footer>Generated privately in CommitTrack. Not financial advice.</footer>
</body>
</html>`;
}
