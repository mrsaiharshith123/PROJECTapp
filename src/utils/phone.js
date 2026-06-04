/** Normalize Indian mobile to 10 digits (strips +91 / spaces). */
export function normalizeIndianPhone(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits.length === 10 ? digits : "";
}

/** Valid 10-digit Indian mobile (6–9 start). */
export function isValidIndianPhone(raw) {
  const n = normalizeIndianPhone(raw);
  return /^[6-9]\d{9}$/.test(n);
}

export function formatIndianPhoneDisplay(raw) {
  const n = normalizeIndianPhone(raw);
  if (!n) return "";
  return `+91 ${n.slice(0, 5)} ${n.slice(5)}`;
}
