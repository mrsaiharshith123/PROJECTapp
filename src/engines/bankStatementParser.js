/**
 * Client-side bank statement text/CSV → normalized transaction rows.
 * Supports HDFC, SBI, ICICI, Axis heuristics + Dr/Cr PDF lines + CSV + generic fallback.
 */

/** @typedef {{ date: string, amount: number, description: string, type: 'debit'|'credit', bank?: string }} BankStatementRow */

const BANK_MARKERS = [
  { id: "hdfc", pattern: /HDFC\s*Bank/i },
  { id: "sbi", pattern: /State\s*Bank\s*of\s*India|SBI/i },
  { id: "icici", pattern: /ICICI\s*Bank/i },
  { id: "axis", pattern: /Axis\s*Bank/i },
  { id: "kotak", pattern: /Kotak\s*Mahindra/i },
  { id: "pnb", pattern: /Punjab\s*National\s*Bank|PNB/i },
];

const DATE_PATTERNS = [
  /(\d{2}[/-]\d{2}[/-]\d{4})/,
  /(\d{2}-\w{3}-\d{4})/i,
  /(\d{4}-\d{2}-\d{2})/,
  /(\d{2}\.\d{2}\.\d{4})/,
];

function detectBank(text) {
  for (const b of BANK_MARKERS) {
    if (b.pattern.test(text)) return b.id;
  }
  return "generic";
}

function parseDateToken(raw) {
  const s = String(raw || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const dmy = s.match(/^(\d{2})[/.-](\d{2})[/.-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  const dmony = s.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/);
  if (dmony) {
    const months = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };
    const m = months[dmony[2].toLowerCase()];
    if (m) return `${dmony[3]}-${m}-${dmony[1]}`;
  }
  return "";
}

function parseAmountToken(raw) {
  const cleaned = String(raw || "")
    .replace(/₹/g, "")
    .replace(/Rs\.?/gi, "")
    .replace(/,/g, "")
    .replace(/\s/g, "")
    .trim();
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Indian bank PDF lines often end with amount + Dr/Cr.
 * @param {string} line
 */
function parseDrCrLine(line) {
  const trimmed = line.trim();
  let dateStr = "";
  let dateRaw = "";
  for (const re of DATE_PATTERNS) {
    const m = trimmed.match(re);
    if (m) {
      dateRaw = m[1];
      dateStr = parseDateToken(m[1]);
      if (dateStr) break;
    }
  }
  if (!dateStr) return null;

  const drCr = trimmed.match(/([\d,]+\.\d{2})\s*(Dr|DR|Cr|CR)(?:\b|$)/i);
  if (!drCr) return null;

  const amount = parseAmountToken(drCr[1]);
  if (amount <= 0) return null;

  const isCredit = /^cr/i.test(drCr[2]);
  const desc = trimmed
    .replace(dateRaw, "")
    .replace(drCr[0], "")
    .replace(/[\d,]+\.\d{2}/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

  return /** @type {Omit<BankStatementRow, 'bank'>} */ ({
    date: dateStr,
    amount,
    description: desc || "Transaction",
    type: isCredit ? "credit" : "debit",
  });
}

/**
 * @param {string} line
 */
function parseGenericLine(line) {
  const drCr = parseDrCrLine(line);
  if (drCr) return drCr;

  const trimmed = line.trim();
  if (trimmed.length < 8) return null;

  let dateStr = "";
  let dateRaw = "";
  for (const re of DATE_PATTERNS) {
    const m = trimmed.match(re);
    if (m) {
      dateRaw = m[1];
      dateStr = parseDateToken(m[1]);
      if (dateStr) break;
    }
  }
  if (!dateStr) return null;

  const withoutDate = trimmed.replace(dateRaw, "");
  const amounts = [...withoutDate.matchAll(/[\d,]+\.\d{2}/g)].map((m) => parseAmountToken(m[0]));
  const debitCandidates = amounts.filter((a) => a > 0);
  if (debitCandidates.length === 0) return null;

  const amount =
    debitCandidates.length >= 3 ? debitCandidates[debitCandidates.length - 2] : debitCandidates[0];
  const desc = withoutDate
    .replace(/[\d,]+\.\d{2}/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

  if (!desc || amount <= 0) return null;
  const isCredit = /\b(cr|credit|salary|neft\s*in|imps\s*in|deposit|by\s*transfer)\b/i.test(trimmed);
  return /** @type {Omit<BankStatementRow, 'bank'>} */ ({
    date: dateStr,
    amount,
    description: desc || "Transaction",
    type: isCredit ? "credit" : "debit",
  });
}

/**
 * Parse CSV export from banks (Date, Narration, Debit, Credit, Balance).
 * @param {string} text
 */
export function parseBankStatementCsv(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase();
  const delim = header.includes("\t") ? "\t" : header.includes(";") ? ";" : ",";
  const cols = lines[0].split(delim).map((c) => c.trim().toLowerCase());

  const dateIdx = cols.findIndex((c) => /date|txn.?date|value.?date|posting/.test(c));
  const descIdx = cols.findIndex((c) => /narrat|description|particular|remarks|details/.test(c));
  const debitIdx = cols.findIndex((c) => /withdraw|debit|dr/.test(c));
  const creditIdx = cols.findIndex((c) => /deposit|credit|cr/.test(c));
  const amountIdx = cols.findIndex((c) => /^amount$|transaction.?amount/.test(c));

  if (dateIdx < 0) return [];

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(delim).map((p) => p.trim().replace(/^"|"$/g, ""));
    const dateStr = parseDateToken(parts[dateIdx]);
    if (!dateStr) continue;

    const desc = (descIdx >= 0 ? parts[descIdx] : parts.slice(1, 3).join(" ")).slice(0, 120);
    let debit = debitIdx >= 0 ? parseAmountToken(parts[debitIdx]) : 0;
    let credit = creditIdx >= 0 ? parseAmountToken(parts[creditIdx]) : 0;

    if (debit <= 0 && credit <= 0 && amountIdx >= 0) {
      const amt = parseAmountToken(parts[amountIdx]);
      if (amt > 0) debit = amt;
    }

    if (debit > 0) {
      rows.push({ date: dateStr, amount: debit, description: desc || "Debit", type: "debit" });
    } else if (credit > 0) {
      rows.push({ date: dateStr, amount: credit, description: desc || "Credit", type: "credit" });
    }
  }
  return rows;
}

function dedupeRows(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = `${row.date}|${row.amount}|${row.type}|${row.description.slice(0, 24)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * @param {string} text
 * @param {{ filename?: string }} [options]
 * @returns {{ rows: BankStatementRow[], bank: string, warnings: string[] }}
 */
export function parseBankStatementText(text, options = {}) {
  const bank = detectBank(text);
  const warnings = [];
  const filename = String(options.filename || "").toLowerCase();

  let rows = [];

  if (filename.endsWith(".csv") || /^date[,;\t]/i.test(text.trim())) {
    rows = parseBankStatementCsv(text);
    if (rows.length > 0) warnings.push(`Parsed ${rows.length} rows from CSV format.`);
  }

  if (rows.length === 0) {
    const lines = String(text || "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length >= 8);

    for (const line of lines) {
      const row = parseGenericLine(line);
      if (!row) continue;
      rows.push({ ...row, bank });
    }
  } else {
    rows = rows.map((r) => ({ ...r, bank }));
  }

  rows = dedupeRows(rows);

  if (rows.length === 0) {
    warnings.push(
      "No transactions detected — for scanned PDFs, export CSV from net banking or ensure text-based PDF.",
    );
  }

  rows.sort((a, b) => a.date.localeCompare(b.date));
  return { rows, bank, warnings };
}

/** Recurring merchant patterns → commitment category hints. */
const RECURRING_HINTS = [
  { re: /netflix|spotify|prime|hotstar|subscription/i, category: "Subscription" },
  { re: /sip|mutual|zerodha|groww|paytm money|kuvera/i, category: "SIP" },
  { re: /emi|loan|hdfc ltd|bajaj fin/i, category: "EMI" },
  { re: /insurance|lic|hdfc life/i, category: "Insurance" },
  { re: /rent|housing/i, category: "Rent" },
];

/**
 * @param {BankStatementRow[]} rows
 */
export function detectRecurringFromStatement(rows) {
  /** @type {Map<string, { description: string, category: string, amounts: number[], dates: string[] }>} */
  const map = new Map();

  for (const r of rows) {
    if (r.type !== "debit") continue;
    const key = r.description.toLowerCase().replace(/\d+/g, "").slice(0, 40).trim();
    if (!key) continue;
    if (!map.has(key)) {
      let category = "Other";
      for (const h of RECURRING_HINTS) {
        if (h.re.test(r.description)) {
          category = h.category;
          break;
        }
      }
      map.set(key, { description: r.description, category, amounts: [], dates: [] });
    }
    const entry = map.get(key);
    entry.amounts.push(r.amount);
    entry.dates.push(r.date);
  }

  return [...map.values()]
    .filter((e) => e.dates.length >= 2)
    .map((e) => {
      const avg = Math.round(e.amounts.reduce((s, a) => s + a, 0) / e.amounts.length);
      return {
        name: e.description.slice(0, 48),
        category: e.category,
        suggestedAmount: avg,
        occurrences: e.dates.length,
        lastDate: e.dates[e.dates.length - 1],
      };
    })
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 12);
}

/**
 * Build commitment drafts from recurring statement hints.
 * @param {ReturnType<typeof detectRecurringFromStatement>} recurring
 */
export function recurringToCommitmentDrafts(recurring) {
  return (recurring || []).map((r) => ({
    name: r.name,
    amount: r.suggestedAmount,
    dueDate: r.lastDate,
    category: r.category === "Other" ? "Subscription" : r.category,
    repeatType: "monthly",
    notes: `Imported from bank statement (${r.occurrences} occurrences)`,
    priority: "normal",
  }));
}
