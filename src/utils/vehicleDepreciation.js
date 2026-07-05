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

/**
 * @param {import('../utils/netWorth/wealthStorage.js').WealthEntry} entry
 * @param {object} [_settings]
 */
export function analyzeVehicle(entry, _settings = {}) {
  const purchasePrice = Number(entry.purchasePrice) || 0;
  const currentValue = Number(entry.value) || 0;
  const refYear = Number(entry.vehicleYear) || Number(entry.purchaseYear) || new Date().getFullYear();
  const age = Math.max(0, new Date().getFullYear() - refYear);

  const estimatedValue = estimateVehicleValue({
    purchasePrice: entry.purchasePrice,
    purchaseYear: entry.purchaseYear,
    vehicleYear: entry.vehicleYear,
  });

  const depreciationLoss =
    purchasePrice > 0 && estimatedValue != null ? purchasePrice - estimatedValue : null;

  const depreciationCurve = [];
  if (purchasePrice > 0) {
    let retained = 1;
    for (let y = 0; y <= Math.min(age + 3, 12); y += 1) {
      if (y > 0) retained *= y === 1 ? 0.85 : 0.9;
      retained = Math.max(retained, 0.2);
      depreciationCurve.push({ year: refYear + y, value: Math.round(purchasePrice * retained) });
    }
  }

  const idealSellBeforeYear = refYear + 5;
  const annualInsurance = purchasePrice > 0 ? Math.round(purchasePrice * 0.04) : null;
  const annualRunning = purchasePrice > 0 ? Math.round(purchasePrice * 0.06) : null;
  const totalCostIncurred =
    purchasePrice > 0 && currentValue > 0 ? purchasePrice - currentValue : null;

  return {
    estimatedValue,
    depreciationLoss,
    age,
    depreciationCurve,
    idealSellBeforeYear,
    annualInsurance,
    annualRunning,
    totalCostIncurred,
    holdVerdict: age >= 5 ? "review" : "hold_moderate",
    holdDetailKey:
      age >= 5 ? "wealthDetail.vehicle.sellWindow" : "wealthDetail.vehicle.holdEarly",
  };
}
