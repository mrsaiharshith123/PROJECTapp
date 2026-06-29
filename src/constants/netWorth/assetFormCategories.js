import { INSTRUMENT_CATEGORY_IDS } from "./wealthCategories.js";

/** Stored ids grouped under "Cash & bank" in the add-asset picker. */
export const LIQUID_STORED_IDS = new Set(["bank", "cash", "savings"]);

/** Stored ids grouped under "Property" in the add-asset picker. */
export const PROPERTY_STORED_IDS = new Set([
  "property_residential",
  "property_land",
  "property_commercial",
]);

/** Picker value for cash / bank / savings. */
export const LIQUID_PICKER_ID = "liquid_cash";

/** Picker value for all property kinds. */
export const PROPERTY_PICKER_ID = "property";

/** @type {{ id: string, labelKey: string }[]} */
export const LIQUID_FORM_SUBTYPES = [
  { id: "bank", labelKey: "netWorth.form.liquidSubtype.account" },
  { id: "cash", labelKey: "netWorth.form.liquidSubtype.cash" },
];

/** @type {{ id: string, labelKey: string }[]} */
export const PROPERTY_FORM_SUBTYPES = [
  { id: "property_residential", labelKey: "netWorth.asset.propertyResidential" },
  { id: "property_land", labelKey: "netWorth.asset.propertyLand" },
  { id: "property_commercial", labelKey: "netWorth.asset.propertyCommercial" },
];

/**
 * Collapse bank / cash / savings and property subtypes into fewer picker rows.
 * @param {import('./wealthCategories.js').WealthCategoryDef[]} categories
 */
export function buildGroupedAssetPickerCategories(categories) {
  const ids = new Set(categories.map((c) => c.id));
  /** @type {import('./wealthCategories.js').WealthCategoryDef[]} */
  const out = [];
  let liquidAdded = false;
  let propertyAdded = false;

  for (const cat of categories) {
    if (LIQUID_STORED_IDS.has(cat.id)) {
      if (!liquidAdded && [...LIQUID_STORED_IDS].some((id) => ids.has(id))) {
        out.push({
          id: LIQUID_PICKER_ID,
          labelKey: "netWorth.asset.liquidCash",
          icon: "bank",
          tier: "liquid",
        });
        liquidAdded = true;
      }
      continue;
    }
    if (PROPERTY_STORED_IDS.has(cat.id)) {
      if (!propertyAdded && [...PROPERTY_STORED_IDS].some((id) => ids.has(id))) {
        out.push({
          id: PROPERTY_PICKER_ID,
          labelKey: "netWorth.asset.property",
          icon: "house",
          tier: "locked",
          indian: true,
        });
        propertyAdded = true;
      }
      continue;
    }
    out.push(cat);
  }
  return out;
}

/**
 * @param {import('./wealthCategories.js').WealthCategoryDef[] | undefined} restrictedCategories
 * @param {"asset" | "liability"} kind
 */
export function getAssetFormPickerCategories(restrictedCategories, kind) {
  if (kind !== "asset") return restrictedCategories ?? [];
  const base = restrictedCategories ?? [];
  const isInstrumentOnly =
    base.length > 0 && base.every((c) => INSTRUMENT_CATEGORY_IDS.has(c.id));
  if (isInstrumentOnly) return base;
  return buildGroupedAssetPickerCategories(base);
}

/**
 * Map UI picker + subtype to persisted wealth category id.
 * @param {string} pickerId
 * @param {string} [subtypeId]
 */
export function resolveStoredCategoryId(pickerId, subtypeId) {
  if (pickerId === LIQUID_PICKER_ID) {
    const sub = subtypeId || "bank";
    if (sub === "cash") return "cash";
    return sub === "savings" ? "savings" : "bank";
  }
  if (pickerId === PROPERTY_PICKER_ID) {
    return PROPERTY_STORED_IDS.has(subtypeId) ? subtypeId : "property_residential";
  }
  return pickerId;
}

/**
 * @param {string} storedId
 */
export function toFormCategoryFields(storedId) {
  const id = String(storedId || "bank");
  if (LIQUID_STORED_IDS.has(id)) {
    const subtype = id === "savings" ? "bank" : id;
    return { categoryId: LIQUID_PICKER_ID, assetSubtype: subtype };
  }
  if (PROPERTY_STORED_IDS.has(id)) {
    return { categoryId: PROPERTY_PICKER_ID, assetSubtype: id };
  }
  return { categoryId: id, assetSubtype: id };
}

/** @param {string} pickerId */
export function defaultSubtypeForPicker(pickerId) {
  if (pickerId === PROPERTY_PICKER_ID) return "property_residential";
  if (pickerId === LIQUID_PICKER_ID) return "bank";
  return pickerId;
}
