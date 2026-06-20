/** @param {string} ifscCode */
const CACHE = new Map();

export async function lookupIfsc(ifscCode) {
  const code = String(ifscCode || "").replace(/\s/g, "").toUpperCase();
  if (code.length !== 11) return null;
  if (CACHE.has(code)) return CACHE.get(code);
  try {
    const res = await fetch(`https://ifsc.razorpay.com/${code}`);
    if (!res.ok) {
      CACHE.set(code, null);
      return null;
    }
    const data = await res.json();
    const result = {
      ifsc: code,
      bank: data.BANK,
      branch: data.BRANCH,
      city: data.CITY,
      state: data.STATE,
      address: data.ADDRESS,
    };
    CACHE.set(code, result);
    return result;
  } catch {
    return null;
  }
}
