/**
 * Analysis for Fixed Deposits, Recurring Deposits, and similar instruments.
 */

const INFLATION = 6;
const NIFTY50_10YR_CAGR = 13.5;

const FD_CATEGORY_IDS = new Set(["fd", "rd", "savings", "bank", "emergency"]);

export function isFdCategory(categoryId) {
  return FD_CATEGORY_IDS.has(categoryId);
}

/**
 * @param {object} entry
 * @param {{ taxSlab?: number, monthlyIncome?: number }} settings
 */
export function analyzeFd(entry, settings = {}) {
  const currentValue = Number(entry.value) || 0;
  const principal = Number(entry.purchasePrice) || 0;
  const interestRate = Number(entry.interestRate) || 0;
  const purchaseYear = entry.purchaseYear ? Number(entry.purchaseYear) : null;
  const purchaseMonth = entry.purchaseMonth ? Number(entry.purchaseMonth) : 1;
  const taxSlab = Number(settings.taxSlab) || 0.3;
  const maturityDate = entry.maturityDate ? new Date(entry.maturityDate) : null;

  const yearsHeld = purchaseYear
    ? Math.max(
        0,
        (Date.now() - new Date(purchaseYear, (purchaseMonth || 1) - 1, 1).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25),
      )
    : null;

  const postTaxRate =
    interestRate > 0 ? Math.round(interestRate * (1 - taxSlab) * 10) / 10 : null;
  const realReturn = postTaxRate != null ? Math.round((postTaxRate - INFLATION) * 10) / 10 : null;

  let maturityValue = null;
  let monthsToMaturity = null;
  if (maturityDate) {
    monthsToMaturity = Math.max(
      0,
      Math.round((maturityDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44)),
    );
    const yearsLeft = monthsToMaturity / 12;
    if (interestRate > 0 && currentValue > 0) {
      maturityValue = Math.round(currentValue * (1 + interestRate / 100) ** yearsLeft);
    }
  }

  const opportunityCostYrs = yearsHeld != null ? Math.round(yearsHeld) : 5;
  const fdMaturedAmount =
    principal > 0 && interestRate > 0
      ? Math.round(principal * (1 + interestRate / 100) ** opportunityCostYrs)
      : null;
  const niftyMaturedAmount =
    principal > 0 ? Math.round(principal * (1 + NIFTY50_10YR_CAGR / 100) ** opportunityCostYrs) : null;

  let holdVerdict = "hold";
  let holdDetailKey = "wealthDetail.fd.holdGoodDetail";
  /** @type {Record<string, string | number> | undefined} */
  let holdDetailParams;

  if (realReturn != null && realReturn < 0) {
    holdVerdict = "review";
    holdDetailKey = "wealthDetail.fd.holdReviewDetail";
    holdDetailParams = { realReturn: Math.abs(realReturn) };
  } else if (maturityDate && monthsToMaturity != null && monthsToMaturity < 3) {
    holdVerdict = "review";
    holdDetailKey = "wealthDetail.fd.holdMaturitySoonDetail";
    holdDetailParams = { months: monthsToMaturity };
  }

  return {
    interestRate,
    postTaxRate,
    realReturn,
    taxSlab,
    yearsHeld: yearsHeld != null ? Math.round(yearsHeld * 10) / 10 : null,
    maturityValue,
    monthsToMaturity,
    fdMaturedAmount,
    niftyMaturedAmount,
    opportunityCostYrs,
    holdVerdict,
    holdDetailKey,
    holdDetailParams,
    debtMfNoteKey: interestRate > 0 ? "wealthDetail.fd.debtMfNote" : null,
    inflation: INFLATION,
    hasDebtMfNote: interestRate > 0,
  };
}
