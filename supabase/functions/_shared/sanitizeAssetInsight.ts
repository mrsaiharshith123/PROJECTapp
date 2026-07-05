const STRING_KEYS = new Set([
  "categoryId",
  "name",
  "location",
  "vehicleMake",
  "areaUnit",
  "notes",
  "ticker",
  "exchange",
  "fundSubType",
  "folio",
]);

const NUMERIC_KEYS = new Set([
  "value",
  "currentValue",
  "areaMeasure",
  "weightGrams",
  "purityKarat",
  "vehicleYear",
  "latitude",
  "longitude",
  "purchaseYear",
  "purchasePrice",
  "quantity",
  "buyPrice",
  "monthlySip",
]);

/** Whitelist asset-insight body fields; strip injection from free text. */
export function sanitizeAssetInsightBody(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const src = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const key of STRING_KEYS) {
    if (!(key in src)) continue;
    const s = String(src[key] ?? "")
      .replace(/[\r\n]+/g, " ")
      .slice(0, 200);
    if (s) out[key] = s;
  }

  for (const key of NUMERIC_KEYS) {
    if (!(key in src)) continue;
    const n = Number(src[key]);
    if (!Number.isFinite(n)) continue;
    out[key] = Math.max(-1e9, Math.min(1e12, n));
  }

  return out;
}
