import { buildPromissoryNoteText } from "../engines/lendingAgreement.js";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textToHtml(text) {
  return escapeHtml(text)
    .split("\n")
    .map((line) => {
      if (line.startsWith("--- ") && line.endsWith(" ---")) {
        return `<h2>${escapeHtml(line.replace(/^---\s*|\s*---$/g, ""))}</h2>`;
      }
      if (line === "PROMISSORY NOTE") return `<h1>${line}</h1>`;
      if (!line.trim()) return "<br/>";
      return `<p>${line}</p>`;
    })
    .join("\n");
}

/** Returns self-contained printable HTML for a promissory note. */
export function generateLegalAgreementHtml(lending, settings = {}) {
  const bodyText = lending.agreementText?.trim() || buildPromissoryNoteText(lending, settings);
  const stamped = lending.esignStatus === "completed";
  const banner = stamped
    ? `<div class="banner ok">✓ Aadhaar eSign completed — ${escapeHtml(lending.esignCompletedAt || "")} · Doc: ${escapeHtml(lending.esignDocumentId || "—")}</div>`
    : `<div class="banner warn">⚠ Not stamped — Print on stamp paper for full legal enforceability. Or complete Aadhaar eSign for digital validity under IT Act 2000.</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Promissory Note — ${escapeHtml(lending.personName || "Loan")}</title>
<style>
  @page { size: A4; margin: 2.5cm; }
  body { font-family: Georgia, "Times New Roman", serif; max-width: 18cm; margin: 0 auto; padding: 1.5cm; color: #111; line-height: 1.55; font-size: 12pt; }
  h1 { font-size: 16pt; text-align: center; letter-spacing: 0.05em; margin-bottom: 1em; }
  h2 { font-size: 11pt; margin-top: 1.25em; border-bottom: 1px solid #ccc; padding-bottom: 0.2em; }
  p { margin: 0.35em 0; }
  .banner { padding: 0.6em 0.8em; margin-bottom: 1.2em; border-radius: 4px; font-size: 10pt; font-family: system-ui, sans-serif; }
  .banner.warn { background: #fff8e6; border: 1px solid #e6c200; color: #664d00; }
  .banner.ok { background: #ecfdf5; border: 1px solid #6ee7b7; color: #065f46; }
  .footer { margin-top: 2em; padding-top: 0.5em; border-top: 1px solid #ddd; font-size: 9pt; color: #555; text-align: center; }
  @media print { .banner { break-inside: avoid; } }
</style>
</head>
<body>
${banner}
${textToHtml(bodyText)}
<div class="footer">CommitTrack — Private Record — ${new Date().toLocaleDateString("en-IN")}</div>
</body>
</html>`;
}

/** Download printable HTML promissory note. */
export function downloadLendingAgreementHtml(lending, settings = {}) {
  const html = generateLegalAgreementHtml(lending, settings);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `committrack-promissory-note-${lending.id}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
