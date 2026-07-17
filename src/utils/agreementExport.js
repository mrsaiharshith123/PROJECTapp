import { buildPromissoryNoteText } from "../engines/lendingAgreement.js";
import { persistAgreementHash } from "../services/lending/agreementHash.js";
import {
  generateAgreementPdfBase64 as pdfBase64,
  downloadAgreementPdf,
  shareOrDownloadAgreementPdf,
} from "./agreementPdf.js";

export { downloadAgreementPdf };

/** @param {string} text */
export async function hashText(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** @param {object} lending @param {object} [settings] */
export async function sealAgreement(lending, settings = {}) {
  const text = lending.agreementText?.trim() || buildPromissoryNoteText(lending, settings);
  const hash = await hashText(text);
  return { text, hash, sealedAt: new Date().toISOString() };
}

/** @param {string} text @param {string} expectedHash */
export async function verifyAgreement(text, expectedHash) {
  const hash = await hashText(text);
  return hash === expectedHash;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textToHtml(text) {
  let clauseOpen = false;
  const parts = escapeHtml(text)
    .split("\n")
    .map((line) => {
      if (line.startsWith("--- ") && line.endsWith(" ---")) {
        const title = escapeHtml(line.replace(/^---\s*|\s*---$/g, ""));
        const closePrev = clauseOpen ? "</div>" : "";
        clauseOpen = true;
        return `${closePrev}<div class="clause"><h2>${title}</h2>`;
      }
      if (line === "PROMISSORY NOTE") return `<h1>${line}</h1>`;
      if (!line.trim()) return "<br/>";
      return `<p>${line}</p>`;
    });
  if (clauseOpen) parts.push("</div>");
  return parts.join("\n");
}

/** Short, stable document reference derived from the lending id — for the "Ref:" line, not a legal registration number. */
function documentReference(lending) {
  return `PEROVO-${String(lending.id || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase() || "DRAFT"}`;
}

/** Returns self-contained printable HTML for a promissory note. */
export function generateLegalAgreementHtml(lending, settings = {}) {
  const bodyText = lending.agreementText?.trim() || buildPromissoryNoteText(lending, settings);
  const stamped = lending.esignStatus === "completed";
  const banner = stamped
    ? `<div class="banner ok">Aadhaar eSign completed — ${escapeHtml(lending.esignCompletedAt || "")} · Doc: ${escapeHtml(lending.esignDocumentId || "—")}</div>`
    : `<div class="banner warn">Not yet stamped — print onto genuine stamp paper below, or complete Aadhaar eSign for digital validity under IT Act 2000.</div>`;
  const hashBanner = lending.agreementHash
    ? `<div class="banner ok">Integrity seal (SHA-256): ${escapeHtml(lending.agreementHash.slice(0, 24))}… · Sealed ${escapeHtml(lending.agreementSealedAt || "")}</div>`
    : "";
  const ref = documentReference(lending);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Promissory Note — ${escapeHtml(lending.personName || "Loan")}</title>
<style>
  @page { size: A4; margin: 1.4cm; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, "Times New Roman", serif; margin: 0; padding: 0; color: #161616; background: #e9e9e9; }
  .sheet {
    max-width: 19cm; margin: 1cm auto; background: #fff; padding: 1.4cm 1.6cm;
    border: 2px solid #1a1a1a; outline: 1px solid #1a1a1a; outline-offset: 5px;
    line-height: 1.6; font-size: 12pt;
  }
  .docref { display: flex; justify-content: space-between; font-family: system-ui, sans-serif; font-size: 8.5pt; color: #666; letter-spacing: 0.03em; margin-bottom: 10px; }
  .stamp-box {
    border: 1.5px dashed #999; border-radius: 4px; padding: 22px 16px; margin-bottom: 18px;
    text-align: center; font-family: system-ui, sans-serif; color: #888; background: #fafafa;
  }
  .stamp-box .stamp-title { font-size: 9pt; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #999; }
  .stamp-box .stamp-sub { font-size: 8.5pt; margin-top: 6px; color: #aaa; }
  h1 { font-size: 17pt; text-align: center; letter-spacing: 0.06em; margin: 0 0 1em; }
  .clause { counter-increment: clause; margin-top: 1.1em; }
  .clause h2 {
    font-size: 11pt; margin: 0 0 0.5em; padding-bottom: 3px; border-bottom: 1px solid #ccc;
    text-transform: uppercase; letter-spacing: 0.04em;
  }
  .clause h2::before { content: counter(clause) ". "; font-weight: 700; }
  body { counter-reset: clause; }
  p { margin: 0.35em 0; text-align: justify; }
  .banner { padding: 0.6em 0.8em; margin-bottom: 0.8em; border-radius: 4px; font-size: 9.5pt; font-family: system-ui, sans-serif; }
  .banner.warn { background: #fff8e6; border: 1px solid #e6c200; color: #664d00; }
  .banner.ok { background: #ecfdf5; border: 1px solid #6ee7b7; color: #065f46; }
  .footer { margin-top: 2em; padding-top: 0.6em; border-top: 1px solid #ddd; font-size: 8.5pt; color: #666; text-align: center; font-family: system-ui, sans-serif; }
  @media print {
    body { background: #fff; }
    .sheet { border: 2px solid #1a1a1a; outline: none; margin: 0; max-width: none; }
    .banner { break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="sheet">
  <div class="docref"><span>Ref: ${escapeHtml(ref)}</span><span>${new Date().toLocaleDateString("en-IN")}</span></div>
  <div class="stamp-box">
    <div class="stamp-title">Space reserved for stamp paper</div>
    <div class="stamp-sub">Print this document onto non-judicial stamp paper of the value required in your state under the Indian Stamp Act 1899, or affix a genuine e-stamp certificate here. Do not substitute this box for real stamp paper.</div>
  </div>
  ${banner}
  ${hashBanner}
  ${textToHtml(bodyText)}
  <div class="footer">Perovo — Private Record — Ref ${escapeHtml(ref)} — ${new Date().toLocaleDateString("en-IN")}</div>
</div>
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
  a.download = `perovo-promissory-note-${lending.id}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Seal agreement with SHA-256, optionally persist hash, and download PDF. */
export async function sealAndDownloadAgreement(lending, settings = {}, userId = null) {
  const { text, hash, sealedAt } = await sealAgreement(
    { ...lending, agreementText: lending.agreementText },
    settings
  );

  if (userId) {
    await persistAgreementHash({
      userId,
      lendingId: lending.id,
      hash,
      sealedAt,
    });
  }

  const { method } = await shareOrDownloadAgreementPdf(
    { ...lending, agreementText: text, agreementHash: hash, agreementSealedAt: sealedAt },
    settings,
  );
  return { hash, sealedAt, shareMethod: method };
}

/** Real PDF base64 for Leegality upload. */
export async function generateAgreementPdfBase64(lending, settings = {}) {
  return pdfBase64(lending, settings);
}
