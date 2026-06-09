import { buildLendingRecord } from "../utils/lendingRecord.js";
import { todayYmd } from "../utils/dates.js";

/**
 * @typedef {{ name: string, share: number, amount: number }} SplitParticipant
 */

/**
 * Equal or custom-ratio bill split.
 * @param {number} totalAmount
 * @param {{ name: string, weight?: number }[]} participants
 */
export function computeBillSplit(totalAmount, participants) {
  const total = Math.max(0, Number(totalAmount) || 0);
  const list = (participants || []).filter((p) => String(p.name || "").trim());
  if (list.length === 0 || total <= 0) {
    return { participants: [], total, remainder: total };
  }

  const weights = list.map((p) => Math.max(0, Number(p.weight) || 1));
  const weightSum = weights.reduce((s, w) => s + w, 0) || list.length;

  let assigned = 0;
  const rows = list.map((p, i) => {
    const isLast = i === list.length - 1;
    const amount = isLast
      ? Math.max(0, total - assigned)
      : Math.round((total * weights[i]) / weightSum);
    if (!isLast) assigned += amount;
    return {
      name: String(p.name).trim(),
      share: Math.round((weights[i] / weightSum) * 100),
      amount,
    };
  });

  return { participants: rows, total, remainder: Math.max(0, total - rows.reduce((s, r) => s + r.amount, 0)) };
}

/**
 * Create micro-lending records for each participant (you lent).
 * @param {{ totalAmount: number, participants: SplitParticipant[], payerName?: string, note?: string }} split
 */
export function buildLendingRecordsFromSplit(split, options = {}) {
  const today = todayYmd();
  const payer = String(options.payerName || "You").trim();
  const note = String(options.note || "Bill split").trim();

  return (split.participants || [])
    .filter((p) => p.amount > 0)
    .map((p) =>
      buildLendingRecord({
        type: "lent",
        personName: p.name,
        totalAmount: p.amount,
        dueDate: today,
        notes: `${note} — ${payer} paid, ${p.name} owes ${p.amount}`,
        relationshipTag: "Friend",
        extra: {
          billSplit: true,
          splitShare: p.share,
          splitSource: options.sourceLabel || "restaurant",
        },
      }),
    );
}

export function billSplitSummaryLine(split) {
  if (!split?.participants?.length) return "No split participants.";
  return split.participants.map((p) => `${p.name}: ₹${p.amount.toLocaleString("en-IN")}`).join(" · ");
}
