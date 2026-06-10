function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

const PAYOUTS_PER_YEAR = {
  yearly: 1,
  "half-yearly": 2,
  quarterly: 4,
  monthly: 12,
};

const RATING_RISK = {
  AAA: 0,
  AA: 5,
  A: 12,
  BBB: 20,
  BB: 35,
  B: 50,
  unrated: 25,
};

function couponPerPeriod(faceValue, couponRatePct, payoutFrequency) {
  const periods = PAYOUTS_PER_YEAR[payoutFrequency] || 1;
  return ((couponRatePct / 100) * faceValue) / periods;
}

/** Approximate YTM for fixed-coupon bond held to maturity. */
function approximateYtm(faceValue, purchasePrice, couponRatePct, yearsToMaturity, payoutFrequency = "yearly") {
  if (faceValue <= 0 || purchasePrice <= 0 || yearsToMaturity <= 0) return 0;
  const annualCoupon = (couponRatePct / 100) * faceValue;
  const approx =
    ((annualCoupon + (faceValue - purchasePrice) / yearsToMaturity) / ((faceValue + purchasePrice) / 2)) * 100;
  if (Number.isFinite(approx) && approx > 0) return approx;
  const periods = PAYOUTS_PER_YEAR[payoutFrequency] || 1;
  const n = Math.max(1, Math.round(yearsToMaturity * periods));
  const c = couponPerPeriod(faceValue, couponRatePct, payoutFrequency);
  let y = couponRatePct / 100;
  for (let i = 0; i < 24; i += 1) {
    let pv = 0;
    let dpv = 0;
    for (let t = 1; t <= n; t += 1) {
      const disc = Math.pow(1 + y / periods, t);
      pv += c / disc;
      dpv -= (t * c) / (disc * (1 + y / periods));
    }
    pv += faceValue / Math.pow(1 + y / periods, n);
    const f = pv - purchasePrice;
    if (Math.abs(f) < 0.5) break;
    if (Math.abs(dpv) < 1e-8) break;
    y -= f / dpv;
    y = clamp(y, 0, 0.35);
  }
  return Math.max(0, y * 100);
}

function effectiveTaxRate(bondType, taxRatePct) {
  if (bondType === "taxfree" || bondType === "sgb") return 0;
  return clamp(Number(taxRatePct) || 0, 0, 50);
}

function annualizedYieldFromPrice(faceValue, couponRatePct, yearsToMaturity, purchasePrice) {
  if (faceValue <= 0 || yearsToMaturity <= 0 || purchasePrice <= 0) return 0;
  const couponPerYear = (couponRatePct / 100) * faceValue;
  const totalFutureValue = faceValue + couponPerYear * yearsToMaturity;
  return (Math.pow(totalFutureValue / purchasePrice, 1 / yearsToMaturity) - 1) * 100;
}

/**
 * @param {{
 *   amount?: number | string,
 *   faceValue?: number | string,
 *   purchasePrice?: number | string,
 *   couponRatePct?: number | string,
 *   yearsToMaturity?: number | string,
 *   taxRatePct?: number | string,
 *   inflationPct?: number | string,
 *   monthlyIncome?: number | string,
 *   bondType?: string,
 *   payoutFrequency?: string,
 *   creditRating?: string,
 * }} input
 */
export function analyzeBond(input) {
  const amount = Math.max(0, Number(input.amount) || 0);
  const faceValue = Math.max(0, Number(input.faceValue) || amount);
  const purchasePrice = Math.max(1, Number(input.purchasePrice) || amount || 1);
  const couponRatePct = Math.max(0, Number(input.couponRatePct) || 0);
  const yearsToMaturity = Math.max(0.5, Number(input.yearsToMaturity) || 1);
  const inflationPct = clamp(Number(input.inflationPct) || 6, 0, 20);
  const monthlyIncome = Math.max(0, Number(input.monthlyIncome) || 0);
  const bondType = input.bondType || "government";
  const payoutFrequency = input.payoutFrequency || "yearly";
  const creditRating =
    input.creditRating || (bondType === "government" || bondType === "sgb" || bondType === "taxfree" ? "AAA" : "unrated");

  const taxRatePct = effectiveTaxRate(bondType, input.taxRatePct);
  const ytmPct = approximateYtm(faceValue, purchasePrice, couponRatePct, yearsToMaturity, payoutFrequency);
  const annualYieldPct = annualizedYieldFromPrice(faceValue, couponRatePct, yearsToMaturity, purchasePrice);
  const postTaxYieldPct = ytmPct * (1 - taxRatePct / 100);
  const realReturnPct = ((1 + postTaxYieldPct / 100) / (1 + inflationPct / 100) - 1) * 100;

  const monthlySetAside = amount / Math.max(1, yearsToMaturity * 12);
  const affordabilityPct = monthlyIncome > 0 ? (monthlySetAside / monthlyIncome) * 100 : null;
  const creditRiskPts = RATING_RISK[creditRating] ?? RATING_RISK.unrated;

  const fdComparable = clamp(inflationPct + 2, 5, 9);
  const sgbTaxNote = bondType === "sgb" || bondType === "taxfree";

  let recommendation = "Borderline";
  let detailKey = "bond.detail.borderline";
  const score =
    realReturnPct * 2 -
    creditRiskPts * 0.15 -
    (affordabilityPct != null && affordabilityPct > 25 ? 8 : 0);

  if (score >= 5 && realReturnPct >= 2 && creditRiskPts <= 15) {
    recommendation = "Good";
    detailKey = sgbTaxNote ? "bond.detail.goodTaxFree" : "bond.detail.good";
  } else if (realReturnPct < 0.5 || creditRiskPts >= 35 || (affordabilityPct != null && affordabilityPct > 30)) {
    recommendation = "Not good";
    detailKey = creditRiskPts >= 35 ? "bond.detail.highRisk" : "bond.detail.weak";
  }

  return {
    annualYieldPct,
    ytmPct: Math.round(ytmPct * 100) / 100,
    postTaxYieldPct: Math.round(postTaxYieldPct * 100) / 100,
    realReturnPct: Math.round(realReturnPct * 100) / 100,
    affordabilityPct,
    monthlySetAside,
    recommendation,
    detailKey,
    creditRiskPts,
    fdComparableYield: fdComparable,
    bondType,
    assumptions: {
      taxRatePct,
      inflationPct,
      yearsToMaturity,
      couponRatePct,
      payoutFrequency,
      creditRating,
      capitalGainsTaxExempt: bondType === "sgb",
    },
  };
}

/**
 * Compare SGB vs FD vs corporate at same ticket size.
 * @param {Parameters<typeof analyzeBond>[0]} baseInput
 */
export function compareBondAlternatives(baseInput) {
  const amount = Math.max(0, Number(baseInput.amount) || 100000);
  const years = Math.max(1, Number(baseInput.yearsToMaturity) || 5);
  const monthlyIncome = Math.max(0, Number(baseInput.monthlyIncome) || 0);
  const inflation = clamp(Number(baseInput.inflationPct) || 6, 0, 20);

  const scenarios = [
    { id: "sgb", bondType: "sgb", couponRatePct: 2.5, creditRating: "AAA", labelKey: "bond.compare.sgb" },
    { id: "fd", bondType: "government", couponRatePct: inflation + 1.5, creditRating: "AAA", labelKey: "bond.compare.fd" },
    {
      id: "corporate",
      bondType: "corporate",
      couponRatePct: inflation + 4,
      creditRating: "A",
      labelKey: "bond.compare.corporate",
    },
  ];

  return scenarios.map((s) => {
    const r = analyzeBond({
      ...baseInput,
      amount,
      faceValue: amount,
      purchasePrice: amount,
      yearsToMaturity: years,
      monthlyIncome,
      inflationPct: inflation,
      bondType: s.bondType,
      couponRatePct: s.couponRatePct,
      creditRating: s.creditRating,
    });
    return { id: s.id, labelKey: s.labelKey, postTaxYieldPct: r.postTaxYieldPct, realReturnPct: r.realReturnPct, recommendation: r.recommendation };
  });
}
