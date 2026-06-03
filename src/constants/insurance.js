/** Premium payment cadence for insurance policies. */
export const INSURANCE_PREMIUM_FREQUENCIES = [
  { id: "monthly", label: "Every month", paymentsPerYear: 12 },
  { id: "quarterly", label: "Every 3 months", paymentsPerYear: 4 },
  { id: "half_yearly", label: "Twice a year", paymentsPerYear: 2 },
  { id: "yearly", label: "Once a year", paymentsPerYear: 1 },
  { id: "single", label: "One-time lump sum", paymentsPerYear: 0 },
];

const freqById = Object.fromEntries(INSURANCE_PREMIUM_FREQUENCIES.map((f) => [f.id, f]));

export function normalizePremiumFrequency(raw) {
  const s = String(raw || "yearly");
  return freqById[s] ? s : "yearly";
}

export function premiumFrequencyLabel(id) {
  return freqById[normalizePremiumFrequency(id)]?.label ?? id;
}

export function paymentsPerYearForFrequency(freq) {
  return freqById[normalizePremiumFrequency(freq)]?.paymentsPerYear ?? 1;
}

export function repeatTypeToPremiumFrequency(repeatType) {
  const rt = String(repeatType || "none");
  if (rt === "monthly") return "monthly";
  if (rt === "quarterly") return "quarterly";
  if (rt === "bimonthly" || rt === "every4months") return "half_yearly";
  if (rt === "yearly") return "yearly";
  return "yearly";
}

/** Fields stored on an insurance bill (tracking only — analysis lives in Tools). */
export function emptyInsuranceFields() {
  return {
    insurancePolicyId: "",
    insuredPersonName: "",
    insuranceCompany: "",
  };
}

/** Display label from policy id + company (+ person). */
/**
 * @param {{ insuranceCompany?: string, insurancePolicyId?: string, insuredPersonName?: string }} fields
 */
export function buildInsuranceBillName({ insuranceCompany, insurancePolicyId, insuredPersonName }) {
  const company = String(insuranceCompany || "").trim();
  const id = String(insurancePolicyId || "").trim();
  const person = String(insuredPersonName || "").trim();

  if (company && id) return `${company} · ${id}`;
  if (company && person) return `${company} · ${person}`;
  if (id && person) return `${id} · ${person}`;
  if (company) return company;
  if (id) return id;
  if (person) return `${person} (Insurance)`;
  return "";
}

export function insuranceBillHasIdentity(fields) {
  return Boolean(
    String(fields.insurancePolicyId || "").trim() ||
      String(fields.insuranceCompany || "").trim() ||
      String(fields.insuredPersonName || "").trim()
  );
}
