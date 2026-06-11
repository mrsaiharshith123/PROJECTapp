import { parseSmsForDebit } from "./smsParser.js";
import { classifyMerchant } from "../utils/merchantNormalize.js";

const CREDIT_HINT = /\b(credited|credit|received|refund|cashback)\b/i;

/** Quick check — debit SMS only (rejects credits/refunds). */
export function isDebitSms(smsText) {
  const text = String(smsText || "").trim();
  if (!text || CREDIT_HINT.test(text)) return false;
  return parseSmsForDebit(text) != null;
}

function extractPayeeName(text) {
  const to =
    text.match(/\bto\s+([A-Za-z0-9][A-Za-z0-9\s.&'/-]{1,40}?)(?:\s+(?:on|UPI|Ref|A\/c|via)|[,.]|$)/i) ||
    text.match(/\bat\s+([A-Za-z0-9][A-Za-z0-9\s.&'/-]{1,40}?)(?:\s+(?:on|UPI|Ref)|[,.]|$)/i);
  return to ? to[1].trim().replace(/\s+/g, " ") : null;
}

function extractReference(text) {
  const m = text.match(/\b(?:Ref(?:erence)?|UPI Ref|Txn(?:\s+ID)?)[:\s]+([A-Z0-9]{6,24})\b/i);
  return m ? m[1] : null;
}

function draftConfidence(parsed, payee, bankLabel) {
  let score = 0.65;
  if (parsed.last4) score += 0.1;
  if (payee && payee !== bankLabel) score += 0.15;
  if (parsed.bank && parsed.bank !== "Unknown Bank") score += 0.05;
  return Math.min(1, Math.round(score * 100) / 100);
}

/** Debit SMS → daily spend draft (no bank sync). */
export function smsTextToDailySpendDraft(smsText) {
  const parsed = parseSmsForDebit(smsText);
  if (!parsed) return null;

  const bankLabel = `${parsed.bank} debit`;
  const payee = extractPayeeName(smsText) || bankLabel;
  const merchant = classifyMerchant(payee);

  return {
    amount: parsed.amount,
    date: parsed.date,
    label: payee,
    lifeCategory: merchant.lifeCategory,
    spendType: merchant.spendType,
    merchantId: merchant.id,
    source: "sms",
    bank: parsed.bank,
    accountLast4: parsed.last4,
    reference: extractReference(smsText),
    confidence: draftConfidence(parsed, payee, bankLabel),
  };
}

/** Parse multiple SMS lines (paste buffer from inbox). */
export function batchSmsToDailySpendDrafts(smsBlock) {
  return String(smsBlock || "")
    .split(/\n+/)
    .map((line) => smsTextToDailySpendDraft(line.trim()))
    .filter(Boolean);
}
