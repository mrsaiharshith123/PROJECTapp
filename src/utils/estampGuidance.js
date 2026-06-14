export const STAMP_DUTY_BY_STATE = {
  "Andhra Pradesh": {
    note: "Promissory note: ₹1 (up to ₹5K), ₹2 (above). Buy at Sub-Registrar office.",
  },
  Karnataka: {
    note: "Promissory note: Schedule I, Article 49. Typically ₹2–5. E-stamp via SHCIL.",
  },
  Maharashtra: {
    note: "Promissory note: ₹1 flat. E-stamp available at shcilestamp.com or Sub-Registrar.",
  },
  "Tamil Nadu": {
    note: "Promissory note: Article 49. ₹1 for demand instruments. Sub-Registrar office.",
  },
  Telangana: {
    note: "Promissory note: ₹2 stamp duty. SHCIL e-stamp or licensed vendor.",
  },
  Delhi: {
    note: "Promissory note: ₹1. E-stamp via SHCIL (shcilestamp.com) or Court fee stamp.",
  },
  Gujarat: {
    note: "Promissory note: ₹1 flat demand. Sub-Registrar or licensed stamp vendor.",
  },
  "West Bengal": {
    note: "Promissory note: ₹1 up to ₹1,000; ₹2 above. Sub-Registrar office.",
  },
  Other: {
    note: "Promissory note stamp duty varies by state (typically ₹1–10). Check with your local Sub-Registrar.",
  },
};

export const ESTAMP_RESOURCES = [
  { labelKey: "lending.stamp.resource.shcil", url: "https://www.shcilestamp.com" },
  { labelKey: "lending.stamp.resource.finder", url: "https://www.shcil.com/products/e-stamping.html" },
];

/** @param {string} [state] */
export function getStampGuidance(state) {
  if (!state) return STAMP_DUTY_BY_STATE.Other;
  const match = Object.keys(STAMP_DUTY_BY_STATE).find(
    (k) => k !== "Other" && state.toLowerCase().includes(k.toLowerCase()),
  );
  return STAMP_DUTY_BY_STATE[match || "Other"];
}
