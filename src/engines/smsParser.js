/**
 * Parse Indian bank debit SMS (pure JS, no imports).
 * @param {string} smsText
 * @returns {{ amount: number, bank: string, last4: string | null, date: string } | null}
 */

const BANK_PATTERNS = [
  /\b(HDFC(?:\s+Bank)?|SBI|ICICI(?:\s+Bank)?|Axis(?:\s+Bank)?|Kotak|PNB|BOB|Canara|Union\s+Bank|Yes\s+Bank|IndusInd|IDFC(?:\s+FIRST)?)\b/i,
];

function parseAmount(text) {
  const patterns = [
    /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /debited\s+(?:for\s+)?(?:Rs\.?|INR)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)\s+debited/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return Math.round(parseFloat(m[1].replace(/,/g, "")) * 100) / 100;
  }
  return null;
}

function parseLast4(text) {
  const m =
    text.match(/(?:a\/c|account|A\/C)\s*(?:XX|\*\*\*\*|X{2,})?(\d{4})\b/i) ||
    text.match(/ending\s+(\d{4})\b/i) ||
    text.match(/XXXX(\d{4})\b/i);
  return m ? m[1] : null;
}

function parseBank(text) {
  for (const re of BANK_PATTERNS) {
    const m = text.match(re);
    if (m) return m[1].replace(/\s+/g, " ").trim();
  }
  const from = text.match(/from\s+([A-Za-z][A-Za-z\s]+?)\s+(?:a\/c|account|A\/C)/i);
  if (from) return from[1].trim();
  return "Unknown Bank";
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function parseDate(text) {
  const today = new Date();
  const isoToday = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;

  let m = text.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (m) {
    let d = parseInt(m[1], 10);
    let mo = parseInt(m[2], 10);
    let y = parseInt(m[3], 10);
    if (y < 100) y += 2000;
    if (d > 12 && mo <= 12) {
      /* dd/mm */
    } else if (mo > 12) {
      const tmp = d;
      d = mo;
      mo = tmp;
    }
    return `${y}-${pad2(mo)}-${pad2(d)}`;
  }

  m = text.match(/(\d{1,2})[-/]([A-Za-z]{3})[-/](\d{4})/i);
  if (m) {
    const months = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
    const mo = months[m[2].slice(0, 3).toLowerCase()];
    if (mo) return `${m[3]}-${pad2(mo)}-${pad2(parseInt(m[1], 10))}`;
  }

  return isoToday;
}

export function parseSmsForDebit(smsText) {
  const text = String(smsText || "").trim();
  if (!text) return null;
  if (!/debit|debited|dr\b/i.test(text)) return null;

  const amount = parseAmount(text);
  if (amount == null || amount <= 0) return null;

  return {
    amount,
    bank: parseBank(text),
    last4: parseLast4(text),
    date: parseDate(text),
  };
}
