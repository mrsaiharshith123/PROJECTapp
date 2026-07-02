/** Numeric fields allowed in financial-advisor context — server rebuilds prompt from these only. */
const NUMERIC_KEYS = new Set([
  "income",
  "monthlyBurden",
  "committedPct",
  "freeCash",
  "pressureScore",
  "survivalMonths",
  "overdueCount",
  "topStressorAmount",
  "dailyLivingCost",
]);

const STRING_KEYS = new Set([
  "pressureLabel",
  "topStressor",
  "livingCostSource",
  "cityLabel",
]);

/**
 * Strip client-supplied prompt injection from contextData; coerce to safe primitives.
 */
export function sanitizeAdvisorContext(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const src = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const key of NUMERIC_KEYS) {
    if (!(key in src)) continue;
    const n = Number(src[key]);
    if (!Number.isFinite(n)) continue;
    out[key] = Math.round(Math.max(-1e12, Math.min(1e12, n)));
  }

  for (const key of STRING_KEYS) {
    if (!(key in src)) continue;
    const s = String(src[key] ?? "")
      .replace(/[\r\n]+/g, " ")
      .slice(0, 120);
    if (s) out[key] = s;
  }

  return out;
}

/** Strip prompt-injection patterns from free-text user questions. */
export function sanitizeUserQuestion(raw: unknown): string {
  let s = String(raw ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim()
    .slice(0, 500);
  // Collapse repeated instruction-like prefixes often used in jailbreaks
  s = s.replace(/\b(ignore|disregard|forget)\s+(all\s+)?(previous|above|prior)\s+(instructions?|rules?)\b/gi, "[filtered]");
  return s;
}
