const STORAGE_KEY = "perovo_applied_ota";

/**
 * @returns {{ version: string, builtAt: string, appliedAt: string } | null}
 */
export function getAppliedOtaRecord() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.version) return null;
    return {
      version: String(parsed.version),
      builtAt: parsed.builtAt ? String(parsed.builtAt) : "",
      appliedAt: parsed.appliedAt ? String(parsed.appliedAt) : "",
    };
  } catch {
    return null;
  }
}

/**
 * Remember the OTA bundle we applied so startup does not re-download the same build.
 * @param {{ version: string, builtAt?: string }} record
 */
export function saveAppliedOtaRecord(record) {
  if (!record?.version) return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: record.version,
        builtAt: record.builtAt || "",
        appliedAt: new Date().toISOString(),
      }),
    );
  } catch {
    /* ignore quota */
  }
}
