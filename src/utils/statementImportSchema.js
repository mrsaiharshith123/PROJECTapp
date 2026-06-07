/**
 * Future statement / CSV import schema (design only — no import UI yet).
 * Maps external rows → DailySpend / BehaviorEvent without banking integration.
 *
 * Expected CSV columns (v1 draft):
 *   date, amount, description, category (optional), merchant (optional)
 *
 * @typedef {object} StatementImportRow
 * @property {string} date YYYY-MM-DD
 * @property {number} amount positive debit amount
 * @property {string} [description]
 * @property {string} [merchant]
 * @property {string} [category] bill category id hint
 *
 * @typedef {object} StatementImportResult
 * @property {import('../utils/dailySpends.js').DailySpend[]} spends
 * @property {number} skipped
 * @property {string[]} warnings
 */

/** @param {Record<string, string>[]} rows */
export function validateStatementImportRows(rows) {
  const warnings = [];
  let valid = 0;
  for (const row of rows || []) {
    const date = String(row.date || row.Date || "").slice(0, 10);
    const amount = Number(String(row.amount || row.Amount || "").replace(/,/g, ""));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      warnings.push(`Invalid date: ${row.date || "(empty)"}`);
      continue;
    }
    if (!amount || amount <= 0) {
      warnings.push(`Invalid amount on ${date}`);
      continue;
    }
    valid += 1;
  }
  return { valid, warnings, ready: valid > 0 && warnings.length < rows.length };
}

export const STATEMENT_IMPORT_VERSION = 1;
