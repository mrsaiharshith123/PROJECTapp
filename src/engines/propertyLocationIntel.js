import { computeAssetCagr, computeRealCagr } from "../utils/netWorth/physicalAssetHelpers.js";
import { monthsSincePurchase } from "../utils/netWorth/propertyValuation.js";
import { INDIAN_CITIES } from "../constants/cityLivingCosts.js";
import { formatInr } from "../constants/symbols.js";

const PROPERTY_IDS = new Set([
  "property",
  "property_residential",
  "property_land",
  "property_commercial",
]);

const DEFAULT_INFLATION_PCT = 6;
const BENCHMARK_REAL_ESTATE_CAGR = 7.5;

/**
 * Tier from property location text first; profile city only as fallback.
 * @param {string} [cityId]
 * @param {string} [locationLabel]
 */
function resolveCityTier(cityId, locationLabel) {
  const label = (locationLabel || "").toLowerCase();
  if (label) {
    if (/hyderabad|secunderabad|cyberabad|gachibowli|hitec/i.test(label)) return "metro";
    if (/warangal|hanamkonda|kazipet|nizamabad|karimnagar/i.test(label)) return "tier2";
    if (/bengaluru|bangalore|mumbai|delhi|chennai|kolkata|pune|noida|gurugram|gurgaon/i.test(label)) {
      return "metro";
    }
    if (/jaipur|lucknow|nagpur|indore|coimbatore|visakhapatnam|vizag|bhubaneswar|mysore|mangalore/i.test(label)) {
      return "tier2";
    }
  }

  const city = cityId ? INDIAN_CITIES.find((c) => c.id === cityId) : null;
  if (city?.tier) {
    if (city.tier === "tier1") return "metro";
    return city.tier;
  }

  return "tier3";
}

/**
 * Tier-based outlook only — no hardcoded city copy.
 * @param {string} tier
 */
function resolveDevelopmentOutlookKey(tier) {
  if (tier === "metro") return "wealthDetail.property.outlookMetro";
  if (tier === "tier2") return "wealthDetail.property.outlookTier2";
  return "wealthDetail.property.outlookTier3";
}

/** @param {string} [locationLabel] */
function resolveOutlookArea(locationLabel) {
  const trimmed = (locationLabel || "").trim();
  if (!trimmed) return "";
  return trimmed.split(",")[0].trim();
}

/**
 * @param {import('../utils/netWorth/wealthStorage.js').WealthEntry} entry
 * @returns {{ price: number, source: "stored" | "derived" | "none" }}
 */
export function resolvePurchasePrice(entry) {
  const direct = Number(entry.purchasePrice) || 0;
  if (direct > 0) return { price: direct, source: "stored" };
  const rate = Number(entry.purchaseRatePerUnit) || 0;
  const area = Number(entry.areaMeasure) || 0;
  if (entry.purchaseRatePerUnit != null && rate > 0 && area > 0) {
    return { price: Math.round(rate * area), source: "derived" };
  }
  return { price: 0, source: "none" };
}

/**
 * Location-aware property / land analysis (heuristic — no live market API).
 * @param {import('../utils/netWorth/wealthStorage.js').WealthEntry} entry
 * @param {{ userCity?: string, monthlyIncome?: number }} [settings]
 */
export function analyzePropertyLocation(entry, settings = {}) {
  if (!PROPERTY_IDS.has(entry.categoryId)) return null;

  const purchasePrice = resolvePurchasePrice(entry);
  const purchaseAmount = purchasePrice.price;
  const currentValue = Number(entry.value) || 0;
  const purchaseYear = entry.purchaseYear ? Number(entry.purchaseYear) : null;
  const purchaseMonth = entry.purchaseMonth ? Number(entry.purchaseMonth) : 1;
  const hasPurchaseData = purchaseAmount > 0 && Boolean(purchaseYear);
  const monthsHeld = purchaseYear ? monthsSincePurchase(purchaseYear, purchaseMonth) : null;
  const yearsHeld = monthsHeld != null ? Math.round((monthsHeld / 12) * 10) / 10 : null;
  const cagr = hasPurchaseData
    ? computeAssetCagr(purchaseAmount, purchaseYear, currentValue, purchaseMonth)
    : null;
  const inflationPct = DEFAULT_INFLATION_PCT;
  const realReturn = hasPurchaseData
    ? computeRealCagr(purchaseAmount, purchaseYear, currentValue, inflationPct, purchaseMonth)
    : null;
  const inflationAdjustedCost =
    hasPurchaseData && yearsHeld != null && yearsHeld > 0
      ? Math.round(purchaseAmount * Math.pow(1 + inflationPct / 100, yearsHeld))
      : null;
  const tier = resolveCityTier(settings.userCity, entry.location);
  const hasPin = entry.latitude != null && entry.longitude != null;

  const benchmarkCagr =
    tier === "metro" ? 8.5 : tier === "tier2" ? 7 : BENCHMARK_REAL_ESTATE_CAGR;
  const vsBenchmark = cagr != null ? Math.round((cagr - benchmarkCagr) * 10) / 10 : null;

  let holdVerdict = "neutral";
  let holdLabelKey = "wealthDetail.property.holdNeutral";
  let holdDetailKey = "wealthDetail.property.holdNeutralDetail";

  if (!hasPurchaseData) {
    holdVerdict = "neutral";
  } else if (cagr != null && realReturn != null) {
    if (realReturn >= 4 && yearsHeld != null && yearsHeld >= 5) {
      holdVerdict = "hold";
      holdLabelKey = "wealthDetail.property.holdGood";
      holdDetailKey = "wealthDetail.property.holdGoodDetail";
    } else if (realReturn < 0) {
      holdVerdict = "review";
      holdLabelKey = "wealthDetail.property.holdReview";
      holdDetailKey = "wealthDetail.property.holdReviewDetail";
    } else if (yearsHeld != null && yearsHeld < 3) {
      holdVerdict = "wait";
      holdLabelKey = "wealthDetail.property.holdWait";
      holdDetailKey = "wealthDetail.property.holdWaitDetail";
    } else if (realReturn >= 0 && yearsHeld != null && yearsHeld >= 10) {
      holdVerdict = "hold_mature";
      holdLabelKey = "wealthDetail.property.holdMature";
      holdDetailKey = "wealthDetail.property.holdMatureDetail";
    } else {
      holdVerdict = "hold_moderate";
      holdLabelKey = "wealthDetail.property.holdModerate";
      holdDetailKey = "wealthDetail.property.holdModerateDetail";
    }
  }

  const targetCagr = 12;
  let yearsToTarget = null;
  if (hasPurchaseData && purchaseAmount > 0 && currentValue > 0 && cagr != null && cagr < targetCagr && cagr > 0) {
    const targetValue = purchaseAmount * Math.pow(1 + targetCagr / 100, Math.max(1, yearsHeld || 1));
    if (currentValue < targetValue) {
      const yearsNeeded = Math.log(targetValue / currentValue) / Math.log(1 + cagr / 100);
      yearsToTarget = Math.round(Math.max(1, yearsNeeded) * 10) / 10;
    }
  }

  const income = Math.max(0, Number(settings.monthlyIncome) || 0);
  const rentYieldByTier =
    entry.categoryId === "property_commercial"
      ? tier === "metro"
        ? 0.055
        : tier === "tier2"
          ? 0.06
          : 0.065
      : entry.categoryId === "property_land"
        ? tier === "metro"
          ? 0
          : tier === "tier2"
            ? 0.015
            : 0.02
        : tier === "metro"
          ? 0.028
          : tier === "tier2"
            ? 0.032
            : 0.035;
  const annualRentEstimate = currentValue * rentYieldByTier;
  const yieldPct =
    currentValue > 0 && rentYieldByTier > 0
      ? Math.round((annualRentEstimate / currentValue) * 1000) / 10
      : null;
  const yieldVsIncome =
    income > 0 && annualRentEstimate > 0
      ? Math.round(((annualRentEstimate / (income * 12)) * 100) * 10) / 10
      : null;

  const developmentOutlookKey = resolveDevelopmentOutlookKey(tier);
  const outlookArea = resolveOutlookArea(entry.location);

  const narrativeKeys = buildPropertyNarrativeKeys({
    hasPurchaseData,
    holdVerdict,
    cagr,
    realReturn,
    inflationPct,
    inflationAdjustedCost,
    purchasePrice: purchaseAmount,
    purchaseSource: purchasePrice.source,
    benchmarkCagr,
    vsBenchmark,
    yearsHeld,
    yieldPct,
    yieldVsIncome,
    tier,
    yearsToTarget,
    currentValue,
    income,
    entry,
  });

  return {
    hasPurchaseData,
    hasPin,
    latitude: entry.latitude,
    longitude: entry.longitude,
    locationLabel: entry.location || "",
    yearsHeld,
    cagr,
    realReturn,
    inflationPct,
    inflationAdjustedCost,
    benchmarkCagr,
    vsBenchmark,
    holdVerdict,
    holdLabelKey,
    holdDetailKey,
    yearsToTarget,
    yieldPct,
    yieldVsIncome,
    developmentOutlookKey,
    outlookArea,
    narrativeKeys,
    areaMeasure: entry.areaMeasure,
    areaUnit: entry.areaUnit,
    tier,
    categoryId: entry.categoryId,
    purchasePrice: purchaseAmount,
    purchaseSource: purchasePrice.source,
  };
}

/**
 * @param {object} ctx
 * @returns {{ id: string, params?: Record<string, string | number> }[]}
 */
function buildPropertyNarrativeKeys(ctx) {
  /** @type {{ id: string, params?: Record<string, string | number> }[]} */
  const keys = [];

  if (ctx.hasPurchaseData && ctx.cagr != null && ctx.realReturn != null) {
    if (ctx.inflationAdjustedCost != null && ctx.purchasePrice > 0 && ctx.yearsHeld != null) {
      keys.push({
        id: "wealthDetail.property.narrative.inflationAdjustedCost",
        params: {
          purchase: formatInr(ctx.purchasePrice),
          todayEquivalent: formatInr(ctx.inflationAdjustedCost),
          current: formatInr(ctx.currentValue),
          years: ctx.yearsHeld,
          inflation: ctx.inflationPct,
        },
      });
      if (ctx.purchaseSource === "derived") {
        keys.push({ id: "wealthDetail.property.narrative.purchaseDerived" });
      }
    }
    keys.push({
      id: "wealthDetail.property.narrative.realReturnExplain",
      params: {
        cagr: ctx.cagr,
        inflation: ctx.inflationPct,
        real: ctx.realReturn,
      },
    });
    keys.push({
      id: "wealthDetail.property.narrative.vsBenchmarkExplain",
      params: {
        cagr: ctx.cagr,
        benchmark: ctx.benchmarkCagr,
        delta: ctx.vsBenchmark ?? 0,
      },
    });
  }

  if (ctx.holdVerdict === "hold_mature" || ctx.holdVerdict === "hold_moderate") {
    keys.push({ id: "wealthDetail.property.narrative.longHoldLiquidity" });
  }

  if (ctx.yieldPct != null) {
    keys.push({
      id: "wealthDetail.property.narrative.rentYieldExplain",
      params: { yield: ctx.yieldPct },
    });
  }

  if (ctx.yieldVsIncome != null && ctx.yieldVsIncome > 0) {
    keys.push({
      id: "wealthDetail.property.narrative.rentVsIncome",
      params: { pct: ctx.yieldVsIncome },
    });
  }

  const annualIncome = ctx.income * 12;
  if (ctx.currentValue > 0 && annualIncome > 0) {
    const valueMultiple = Math.round((ctx.currentValue / annualIncome) * 10) / 10;
    if (valueMultiple >= 3) {
      keys.push({
        id: "wealthDetail.property.narrative.valueVsIncome",
        params: { multiple: valueMultiple },
      });
    }
  }

  if (ctx.tier === "tier3" && ctx.currentValue >= 5_000_000) {
    keys.push({ id: "wealthDetail.property.narrative.highValueTier3Liquidity" });
  } else if (ctx.tier === "tier2" && ctx.currentValue >= 15_000_000) {
    keys.push({ id: "wealthDetail.property.narrative.highValueTier2Liquidity" });
  }

  if (ctx.yearsToTarget != null && ctx.yearsToTarget > 15) {
    keys.push({
      id: "wealthDetail.property.narrative.targetCagrReality",
      params: { years: ctx.yearsToTarget },
    });
  }

  if (ctx.entry?.categoryId === "property_land") {
    keys.push({ id: "wealthDetail.property.narrative.landHold" });
  } else if (ctx.entry?.categoryId === "property_commercial") {
    keys.push({ id: "wealthDetail.property.narrative.commercialHold" });
  } else {
    keys.push({ id: "wealthDetail.property.narrative.residentialHold" });
  }

  keys.push({ id: "wealthDetail.property.narrative.verifyTitle" });

  return keys;
}

export function isPropertyCategory(categoryId) {
  return PROPERTY_IDS.has(categoryId);
}
