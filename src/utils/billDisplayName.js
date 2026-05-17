import { buildInsuranceBillName } from "../constants/insurance.js";

export function getBillDisplayName(bill) {
  if (!bill) return "";
  if (bill.category === "Insurance") {
    const built = buildInsuranceBillName(bill);
    if (built) return built;
  }
  return bill.name || "Untitled";
}
