import { escapeHtml, openHtmlInNewTab } from "./shareCardHtml.js";

/**
 * Privacy-safe share card — scores and labels, optional rounded amounts.
 */
export function generateLifeScoreShareCardHtml({
  healthScore,
  healthLabel,
  pressureScore,
  pressureLabel,
  survivalMonths,
  survivalLabel,
  displayName = "Perovo user",
}) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Financial Life Score</title>
<style>body{font-family:system-ui,sans-serif;background:linear-gradient(135deg,#1a1033,#0d1f2d);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;margin:0}
.card{width:400px;max-width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:28px;color:#f0eff8}
h1{font-size:1.1rem;margin:0 0 4px;opacity:.85} h2{font-size:2rem;margin:0 0 20px}
.row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:14px}
.val{font-weight:700;color:#a5b4fc}.footer{margin-top:20px;font-size:11px;opacity:.6;text-align:center}</style></head>
<body><div class="card"><h1>${escapeHtml(displayName)}</h1><h2>Financial Life</h2>
<div class="row"><span>Health</span><span class="val">${healthScore ?? "—"}/100 · ${escapeHtml(healthLabel || "")}</span></div>
<div class="row"><span>Pressure</span><span class="val">${pressureScore ?? "—"}/100 · ${escapeHtml(pressureLabel || "")}</span></div>
<div class="row"><span>Survival runway</span><span class="val">${survivalMonths != null ? `${survivalMonths} mo` : "—"} · ${escapeHtml(survivalLabel || "")}</span></div>
<p class="footer">Perovo — private snapshot, no account details shared.</p></div></body></html>`;
}

export function lifeScoreSharePlainText(data) {
  return `Financial Life snapshot\nHealth: ${data.healthScore}/100 (${data.healthLabel})\nPressure: ${data.pressureScore}/100 (${data.pressureLabel})\nRunway: ${data.survivalMonths ?? "—"} months\n— Perovo`;
}

export function openLifeScoreShareCard(data) {
  openHtmlInNewTab(generateLifeScoreShareCardHtml(data));
}

export function generateSurvivalShareCardHtml({ survivalMonths, tierLabel, classification }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Survival score</title>
<style>body{font-family:system-ui;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{padding:32px;border-radius:16px;background:#1e293b;max-width:360px;text-align:center}
.big{font-size:3rem;font-weight:800;color:#34d399;margin:12px 0}</style></head>
<body><div class="card"><p>Emergency runway</p><div class="big">${survivalMonths ?? "—"}</div><p>months · ${escapeHtml(tierLabel || "")}</p>
<p style="opacity:.7;font-size:13px">${escapeHtml(classification || "")}</p></div></body></html>`;
}
