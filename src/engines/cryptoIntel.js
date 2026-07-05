/**
 * Crypto holding analysis — Indian tax rules (flat 30% on gains).
 */

const INFLATION = 6;

/**
 * @param {import('../utils/netWorth/wealthStorage.js').WealthEntry} entry
 * @param {object} [_settings]
 */
export function analyzeCrypto(entry, _settings = {}) {
  const currentValue = Number(entry.value) || 0;
  const cost = Number(entry.purchasePrice) || 0;
  const purchaseYear = entry.purchaseYear ? Number(entry.purchaseYear) : null;

  const yearsHeld = purchaseYear
    ? Math.max(
        0,
        (Date.now() - new Date(purchaseYear, 0, 1).getTime()) / (365.25 * 24 * 3600 * 1000),
      )
    : null;

  const gain = cost > 0 ? currentValue - cost : null;
  const gainPct =
    cost > 0 && gain != null ? Math.round((gain / cost) * 1000) / 10 : null;
  const cagr =
    cost > 0 && currentValue > 0 && yearsHeld != null && yearsHeld > 0
      ? Math.round(((currentValue / cost) ** (1 / yearsHeld) - 1) * 1000) / 10
      : null;

  const taxIfSold = gain != null && gain > 0 ? Math.round(gain * 0.3) : 0;
  const netProceeds = currentValue - taxIfSold;

  const tdsApplicable = currentValue > 50000;
  const tdsAmount = tdsApplicable ? Math.round(currentValue * 0.01) : 0;

  const realReturn = cagr != null ? Math.round((cagr - INFLATION) * 10) / 10 : null;

  return {
    gain,
    gainPct,
    cagr,
    realReturn,
    yearsHeld: yearsHeld != null ? Math.round(yearsHeld * 10) / 10 : null,
    taxIfSold,
    netProceeds,
    tdsApplicable,
    tdsAmount,
    taxNoteKey: "wealthDetail.crypto.taxNote30pct",
    riskNoteKey: "wealthDetail.crypto.highRiskNote",
    lossOffsetNoteKey: "wealthDetail.crypto.noLossOffset",
    holdVerdict: "hold_monitor",
    holdDetailKey: "wealthDetail.crypto.holdMonitor",
  };
}
