const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export function normalizePan(input) {
  return String(input || "").trim().toUpperCase();
}

export function isValidPan(input) {
  return PAN_REGEX.test(normalizePan(input));
}

export function maskPan(input) {
  const pan = normalizePan(input);
  if (pan.length !== 10) return pan;
  return `${pan.slice(0, 3)}****${pan.slice(7)}`;
}
