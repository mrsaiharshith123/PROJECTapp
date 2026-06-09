import { normalizeDailySpend } from "./dailySpends.js";
/**
 * Map parsed bank rows → daily spend drafts (debits only).
 * @param {import('../engines/bankStatementParser.js').BankStatementRow[]} rows
 * @param {string} [profileId]
 */
export function bankRowsToDailySpendDrafts(rows, profileId = "default") {
  const drafts = [];
  const skipped = [];

  for (const r of rows || []) {
    if (r.type === "credit") {
      skipped.push(r);
      continue;
    }
    drafts.push(
      normalizeDailySpend({
        date: r.date,
        amount: r.amount,
        category: "Other",
        note: r.description,
        profileId,
        source: "bank_statement",
      }),
    );
  }

  return { drafts, skippedCredits: skipped.length, count: drafts.length };
}

/**
 * Dedupe against existing spends by date+amount+note prefix.
 */
export function filterDuplicateSpends(drafts, existingSpends = []) {
  const keys = new Set(
    (existingSpends || []).map((s) => `${s.date}|${s.amount}|${String(s.note || "").slice(0, 20)}`),
  );
  return drafts.filter((d) => !keys.has(`${d.date}|${d.amount}|${String(d.note || "").slice(0, 20)}`));
}
