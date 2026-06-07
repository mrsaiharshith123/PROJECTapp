import { parseSmsForDebit } from "./smsParser.js";
import { classifyMerchant } from "../utils/merchantNormalize.js";

/** Debit SMS → daily spend draft (no bank sync). */
export function smsTextToDailySpendDraft(smsText) {
  const parsed = parseSmsForDebit(smsText);
  if (!parsed) return null;
  const label = `${parsed.bank} debit`;
  const merchant = classifyMerchant(label);
  return {
    amount: parsed.amount,
    date: parsed.date,
    label: label || "Debit",
    lifeCategory: merchant.lifeCategory,
    spendType: merchant.spendType,
    merchantId: merchant.id,
    source: "sms",
  };
}
