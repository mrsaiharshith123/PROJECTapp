#!/usr/bin/env node
import fs from "fs";

const modalPath = "src/ui/features/netWorth/WealthEntryModal.jsx";
const lines = fs.readFileSync(modalPath, "utf8").split(/\r?\n/);

const stateImports = `import { getAssetCategory, getLiabilityCategory } from "../../../constants/netWorth/wealthCategories.js";
import { toFormCategoryFields } from "../../../constants/netWorth/assetFormCategories.js";
import { PHYSICAL_ASSET_TYPES } from "../../../services/ai/assetInsight.js";

export const AREA_UNITS = ["sqyd", "sqft", "sqm", "acre"];
export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
`;

const stateBody = lines.slice(31, 110).join("\n");
fs.writeFileSync(
  "src/ui/features/netWorth/wealthEntryFormState.js",
  `${stateImports}\n${stateBody}\n`,
);

const formImports = `import { useEffect, useMemo, useRef, useState } from "react";
import { CORE_ASSET_CATEGORIES, LIABILITY_CATEGORIES } from "../../../constants/netWorth/wealthCategories.js";
import {
  defaultSubtypeForPicker,
  getAssetFormPickerCategories,
  LIQUID_FORM_SUBTYPES,
  LIQUID_PICKER_ID,
  PROPERTY_FORM_SUBTYPES,
  PROPERTY_PICKER_ID,
  PROPERTY_STORED_IDS,
  resolveStoredCategoryId,
  toFormCategoryFields,
} from "../../../constants/netWorth/assetFormCategories.js";
import { fetchPropertyAiBundle } from "../../../services/ai/assetInsight.js";
import { isGoldApiConfigured, shouldRefreshGoldRate } from "../../../services/market/goldPrice.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { computeAssetCagr, computeGoldAutoValue } from "../../../utils/netWorth/physicalAssetHelpers.js";
import {
  computePurchasePriceFromRate,
  isResidentialProperty,
} from "../../../utils/netWorth/propertyValuation.js";
import { estimateVehicleValue } from "../../../utils/vehicleDepreciation.js";
import { formatInr } from "../../../constants/symbols.js";
import { inputClassName } from "../../index.js";
import { LocationMapPicker } from "../../patterns/LocationMapPicker.jsx";
import { emptyForm, entryToForm, isPhysicalCategory, MONTH_OPTIONS, resolveEntryName } from "./wealthEntryFormState.js";

`;

const formBody = lines.slice(111, 811).join("\n");
fs.writeFileSync("src/ui/features/netWorth/WealthEntryForm.jsx", `${formImports}${formBody}\n`);

const modalNew = `import { useTranslation } from "../../../i18n/I18nProvider.js";
import { Modal } from "../../index.js";
import WealthEntryForm from "./WealthEntryForm.jsx";

export default function WealthEntryModal({
  open,
  kind,
  entry,
  defaultCategoryId = undefined,
  restrictedCategories = undefined,
  onClose,
  onSave,
}) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <Modal
      title={t(entry ? "netWorth.editEntry" : kind === "asset" ? "netWorth.addAsset" : "netWorth.addLiability")}
      onClose={onClose}
    >
      <WealthEntryForm
        key={\`\${kind}-\${entry?.id ?? "new"}-\${defaultCategoryId ?? ""}\`}
        kind={kind}
        entry={entry}
        defaultCategoryId={defaultCategoryId}
        restrictedCategories={restrictedCategories}
        onClose={onClose}
        onSave={onSave}
      />
    </Modal>
  );
}
`;
fs.writeFileSync(modalPath, modalNew);
console.log("Split WealthEntryModal → wealthEntryFormState.js, WealthEntryForm.jsx");
