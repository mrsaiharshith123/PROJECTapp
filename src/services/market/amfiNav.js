const AMFI_BASE = "https://api.mfapi.in";

/** @param {string | number} schemeCode */
export async function fetchFundNav(schemeCode) {
  if (!schemeCode) return null;
  try {
    const res = await fetch(`${AMFI_BASE}/mf/${schemeCode}`);
    if (!res.ok) return null;
    const data = await res.json();
    const latest = data?.data?.[0];
    if (!latest) return null;
    return {
      schemeCode: String(schemeCode),
      schemeName: data.meta?.scheme_name || "",
      nav: parseFloat(latest.nav),
      date: latest.date,
    };
  } catch {
    return null;
  }
}

/** @param {string} query */
export async function searchFund(query) {
  if (!query || query.length < 3) return [];
  try {
    const res = await fetch(`${AMFI_BASE}/mf/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data || []).slice(0, 10).map((f) => ({
      schemeCode: String(f.schemeCode),
      schemeName: f.schemeName,
    }));
  } catch {
    return [];
  }
}

/** @alias searchFund */
export const searchAmfiFunds = searchFund;

/** @param {{ unitsHeld?: number, currentNav?: number, amount?: number }} sip */
export function estimateCurrentValue(sip) {
  const units = Number(sip.unitsHeld || 0);
  const nav = Number(sip.currentNav || 0);
  if (units > 0 && nav > 0) return units * nav;
  const invested = Number(sip.amount || 0) * 12;
  return invested * 1.12;
}
