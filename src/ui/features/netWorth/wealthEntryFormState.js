import { getAssetCategory, getLiabilityCategory } from "../../../constants/netWorth/wealthCategories.js";
import { toFormCategoryFields } from "../../../constants/netWorth/assetFormCategories.js";
import { PHYSICAL_ASSET_TYPES } from "../../../services/ai/assetInsight.js";
import { isResidentialProperty } from "../../../utils/netWorth/propertyValuation.js";

export const AREA_UNITS = ["sqyd", "sqft", "sqm", "acre"];
export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

export const emptyForm = (kind, defaultCategoryId) => {
  const mapped = toFormCategoryFields(
    kind === "asset" ? defaultCategoryId || "bank" : "personal_loan",
  );
  return {
    kind,
    categoryId: kind === "asset" ? mapped.categoryId : "personal_loan",
    assetSubtype: kind === "asset" ? mapped.assetSubtype : "personal_loan",
    name: "",
    value: "",
    notes: "",
    interestRate: "",
    emi: "",
    purchaseYear: "",
    purchaseMonth: "",
    purchasePrice: "",
    purchaseRatePerUnit: "",
    valueManual: false,
    location: "",
    latitude: null,
    longitude: null,
    areaUnit: "sqyd",
    areaMeasure: "",
    weightGrams: "",
    purityKarat: "",
    vehicleMake: "",
    vehicleYear: "",
    trackGrowth: false,
  };
};

/** @param {string} name @param {string} categoryId @param {"asset"|"liability"} kind @param {(k: string) => string} t */
export function resolveEntryName(name, categoryId, kind, t) {
  const trimmed = String(name || "").trim();
  if (trimmed) return trimmed;
  const cat = kind === "asset" ? getAssetCategory(categoryId) : getLiabilityCategory(categoryId);
  return t(cat.labelKey);
}

/** @param {import('../../../utils/netWorth/wealthStorage.js').WealthEntry | null | undefined} entry */
export function entryToForm(entry, kind, defaultCategoryId) {
  if (!entry) return emptyForm(kind || "asset", defaultCategoryId);
  const mapped = toFormCategoryFields(entry.categoryId);
  return {
    kind: entry.kind,
    categoryId: mapped.categoryId,
    assetSubtype: mapped.assetSubtype,
    name: entry.name,
    value: String(entry.value),
    notes: entry.notes || "",
    interestRate: entry.interestRate != null ? String(entry.interestRate) : "",
    emi: entry.emi != null ? String(entry.emi) : "",
    purchaseYear: entry.purchaseYear != null ? String(entry.purchaseYear) : "",
    purchaseMonth: entry.purchaseMonth != null ? String(entry.purchaseMonth) : "",
    purchasePrice: entry.purchasePrice != null ? String(entry.purchasePrice) : "",
    purchaseRatePerUnit:
      entry.purchaseRatePerUnit != null
        ? String(entry.purchaseRatePerUnit)
        : entry.purchasePrice && entry.areaMeasure
          ? String(Math.round(Number(entry.purchasePrice) / Number(entry.areaMeasure)))
          : "",
    valueManual: !entry.valueAutoEstimated,
    location: entry.location || "",
    latitude: entry.latitude ?? null,
    longitude: entry.longitude ?? null,
    areaUnit: entry.areaUnit || (isResidentialProperty(entry.categoryId) ? "sqyd" : "sqft"),
    areaMeasure: entry.areaMeasure != null ? String(entry.areaMeasure) : "",
    weightGrams: entry.weightGrams != null ? String(entry.weightGrams) : "",
    purityKarat: entry.purityKarat != null ? String(entry.purityKarat) : "",
    vehicleMake: entry.vehicleMake || "",
    vehicleYear: entry.vehicleYear != null ? String(entry.vehicleYear) : "",
    trackGrowth: Boolean(entry.purchaseYear || entry.purchasePrice),
  };
}

/** @param {string} categoryId */
export function isPhysicalCategory(categoryId) {
  return PHYSICAL_ASSET_TYPES.includes(categoryId);
}
