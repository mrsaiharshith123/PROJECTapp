/**
 * Estimate current vehicle value from purchase price and age (Indian depreciation curve).
 * @param {{ purchasePrice?: number, purchaseYear?: number, vehicleYear?: number }} params
 * @returns {number | null}
 */
export function estimateVehicleValue({ purchasePrice, purchaseYear, vehicleYear }) {
  const price = Number(purchasePrice) || 0;
  if (price <= 0) return null;

  const refYear = Number(vehicleYear) || Number(purchaseYear) || new Date().getFullYear();
  const age = Math.max(0, new Date().getFullYear() - refYear);

  let retained = 1;
  for (let y = 0; y < age; y += 1) {
    retained *= y === 0 ? 0.85 : 0.9;
  }
  retained = Math.max(retained, 0.2);

  return Math.round(price * retained);
}
