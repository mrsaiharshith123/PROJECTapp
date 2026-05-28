function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function annualizedYieldFromPrice(faceValue, couponRatePct, yearsToMaturity, purchasePrice) {
  if (faceValue <= 0 || yearsToMaturity <= 0 || purchasePrice <= 0) return 0;
  const couponPerYear = (couponRatePct / 100) * faceValue;
  const totalFutureValue = faceValue + couponPerYear * yearsToMaturity;
  return (Math.pow(totalFutureValue / purchasePrice, 1 / yearsToMaturity) - 1) * 100;
}

export function analyzeBond(input) {
  const amount = Math.max(0, Number(input.amount) || 0);
  const faceValue = Math.max(0, Number(input.faceValue) || amount);
  const purchasePrice = Math.max(1, Number(input.purchasePrice) || amount || 1);
  const couponRatePct = Math.max(0, Number(input.couponRatePct) || 0);
  const yearsToMaturity = Math.max(0.5, Number(input.yearsToMaturity) || 1);
  const taxRatePct = clamp(Number(input.taxRatePct) || 0, 0, 50);
  const inflationPct = clamp(Number(input.inflationPct) || 6, 0, 20);
  const monthlyIncome = Math.max(0, Number(input.monthlyIncome) || 0);

  const annualYieldPct = annualizedYieldFromPrice(faceValue, couponRatePct, yearsToMaturity, purchasePrice);
  const postTaxYieldPct = annualYieldPct * (1 - taxRatePct / 100);
  const realReturnPct = ((1 + postTaxYieldPct / 100) / (1 + inflationPct / 100) - 1) * 100;

  const monthlySetAside = amount / Math.max(1, yearsToMaturity * 12);
  const affordabilityPct = monthlyIncome > 0 ? (monthlySetAside / monthlyIncome) * 100 : null;

  let recommendation = "Borderline";
  let detail = "Returns are moderate; compare against safer alternatives before investing.";
  if (realReturnPct >= 3 && (affordabilityPct == null || affordabilityPct <= 20)) {
    recommendation = "Good";
    detail = "Post-tax real return looks healthy and fits your current salary bandwidth.";
  } else if (realReturnPct < 1 || (affordabilityPct != null && affordabilityPct > 30)) {
    recommendation = "Not good";
    detail = "Either real return is weak or allocation is heavy for your monthly income.";
  }

  return {
    annualYieldPct,
    postTaxYieldPct,
    realReturnPct,
    affordabilityPct,
    monthlySetAside,
    recommendation,
    detail,
    assumptions: {
      taxRatePct,
      inflationPct,
      yearsToMaturity,
      couponRatePct,
    },
  };
}
