import { useMemo, useState } from "react";
import { ASSET_CATEGORIES, LIABILITY_CATEGORIES } from "../../../constants/netWorth/wealthCategories.js";
import { PHYSICAL_ASSET_TYPES } from "../../../services/ai/assetInsight.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { computeAssetCagr } from "../../../utils/netWorth/physicalAssetHelpers.js";
import { estimateVehicleValue } from "../../../utils/vehicleDepreciation.js";
import { formatInr } from "../../../constants/symbols.js";
import { Modal, inputClassName } from "../../index.js";

const PROPERTY_IDS = new Set([
  "property",
  "property_residential",
  "property_land",
  "property_commercial",
]);

const AREA_UNITS = ["sqft", "sqm", "acre"];

const emptyForm = (kind, defaultCategoryId) => ({
  kind,
  categoryId: kind === "asset" ? defaultCategoryId || "bank" : "personal_loan",
  name: "",
  value: "",
  notes: "",
  interestRate: "",
  emi: "",
  purchaseYear: "",
  purchasePrice: "",
  location: "",
  areaUnit: "sqft",
  areaMeasure: "",
  weightGrams: "",
  purityKarat: "",
  vehicleMake: "",
  vehicleYear: "",
});

/** @param {import('../../../utils/netWorth/wealthStorage.js').WealthEntry | null | undefined} entry */
function entryToForm(entry, kind, defaultCategoryId) {
  if (!entry) return emptyForm(kind || "asset", defaultCategoryId);
  return {
    kind: entry.kind,
    categoryId: entry.categoryId,
    name: entry.name,
    value: String(entry.value),
    notes: entry.notes || "",
    interestRate: entry.interestRate != null ? String(entry.interestRate) : "",
    emi: entry.emi != null ? String(entry.emi) : "",
    purchaseYear: entry.purchaseYear != null ? String(entry.purchaseYear) : "",
    purchasePrice: entry.purchasePrice != null ? String(entry.purchasePrice) : "",
    location: entry.location || "",
    areaUnit: entry.areaUnit || "sqft",
    areaMeasure: entry.areaMeasure != null ? String(entry.areaMeasure) : "",
    weightGrams: entry.weightGrams != null ? String(entry.weightGrams) : "",
    purityKarat: entry.purityKarat != null ? String(entry.purityKarat) : "",
    vehicleMake: entry.vehicleMake || "",
    vehicleYear: entry.vehicleYear != null ? String(entry.vehicleYear) : "",
  };
}

/** @param {string} categoryId */
function isPhysicalCategory(categoryId) {
  return PHYSICAL_ASSET_TYPES.includes(categoryId);
}

function WealthEntryForm({ kind, entry, defaultCategoryId, restrictedCategories, onClose, onSave }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(() => entryToForm(entry, kind, defaultCategoryId));

  const categories =
    restrictedCategories ?? (form.kind === "asset" ? ASSET_CATEGORIES : LIABILITY_CATEGORIES);
  const fieldClass = `${inputClassName()} ct-input-tint`;
  const physical = form.kind === "asset" && isPhysicalCategory(form.categoryId);
  const isProperty = PROPERTY_IDS.has(form.categoryId);
  const isVehicle = form.categoryId === "vehicle";
  const isGold = form.categoryId === "gold";
  const isBusiness = form.categoryId === "business";

  const cagr = useMemo(() => {
    if (!physical) return null;
    const price = Number(form.purchasePrice);
    const year = Number(form.purchaseYear);
    const value = Number(form.value);
    if (!price || !year || !value) return null;
    return computeAssetCagr(price, year, value);
  }, [physical, form.purchasePrice, form.purchaseYear, form.value]);

  const vehicleEstimate = useMemo(() => {
    if (!isVehicle) return null;
    const price = Number(form.purchasePrice);
    if (!price) return null;
    return estimateVehicleValue({
      purchasePrice: price,
      purchaseYear: Number(form.purchaseYear) || undefined,
      vehicleYear: Number(form.vehicleYear) || undefined,
    });
  }, [isVehicle, form.purchasePrice, form.purchaseYear, form.vehicleYear]);

  const submit = () => {
    if (!form.name.trim() || !form.value) return;
    const payload = {
      kind: form.kind,
      categoryId: form.categoryId,
      name: form.name.trim(),
      value: Number(form.value),
      notes: form.notes.trim(),
      interestRate: form.interestRate !== "" ? Number(form.interestRate) : undefined,
      emi: form.emi !== "" ? Number(form.emi) : undefined,
    };

    if (physical) {
      Object.assign(payload, {
        purchaseYear: form.purchaseYear !== "" ? Number(form.purchaseYear) : undefined,
        purchasePrice: form.purchasePrice !== "" ? Number(form.purchasePrice) : undefined,
        location: form.location.trim() || undefined,
      });
    }

    if (isProperty) {
      Object.assign(payload, {
        areaUnit: form.areaMeasure ? form.areaUnit : undefined,
        areaMeasure: form.areaMeasure !== "" ? Number(form.areaMeasure) : undefined,
      });
    }

    if (isGold) {
      Object.assign(payload, {
        weightGrams: form.weightGrams !== "" ? Number(form.weightGrams) : undefined,
        purityKarat: form.purityKarat !== "" ? Number(form.purityKarat) : undefined,
      });
    }

    if (isVehicle) {
      Object.assign(payload, {
        vehicleMake: form.vehicleMake.trim() || undefined,
        vehicleYear: form.vehicleYear !== "" ? Number(form.vehicleYear) : undefined,
      });
    }

    onSave(payload);
    onClose();
  };

  return (
    <div className="ct-stack">
      <div>
        <label className="ct-field-label">{t("netWorth.form.category")}</label>
        <select
          className={fieldClass}
          value={form.categoryId}
          onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {t(c.labelKey)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="ct-field-label">{t("netWorth.form.name")}</label>
        <input
          className={fieldClass}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder={t("netWorth.form.namePh")}
        />
      </div>
      <div>
        <label className="ct-field-label">{t("netWorth.form.value")}</label>
        <input
          type="number"
          min="0"
          className={fieldClass}
          value={form.value}
          onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
        />
      </div>

      {physical && (
        <>
          <div className="ct-grid-2 gap-2">
            <div>
              <label className="ct-field-label">{t("netWorth.form.purchaseYear")}</label>
              <input
                type="number"
                min="1950"
                max="2100"
                className={fieldClass}
                value={form.purchaseYear}
                onChange={(e) => setForm((f) => ({ ...f, purchaseYear: e.target.value }))}
                placeholder={t("netWorth.form.purchaseYearPh")}
              />
            </div>
            <div>
              <label className="ct-field-label">{t("netWorth.form.purchasePrice")}</label>
              <input
                type="number"
                min="0"
                className={fieldClass}
                value={form.purchasePrice}
                onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))}
              />
            </div>
          </div>
          {cagr != null && (
            <div className="ct-stat-tile teal">
              <p className="ct-stat-tile-value text-sm">
                {t("netWorth.physical.cagrHint", { pct: `${cagr >= 0 ? "+" : ""}${cagr.toFixed(1)}` })}
              </p>
            </div>
          )}
        </>
      )}

      {(isProperty || isBusiness) && (
        <div>
          <label className="ct-field-label">{t("netWorth.form.location")}</label>
          <input
            className={fieldClass}
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            placeholder={t("netWorth.form.locationPh")}
          />
        </div>
      )}

      {isProperty && (
        <div className="ct-grid-2 gap-2">
          <div>
            <label className="ct-field-label">{t("netWorth.form.areaMeasure")}</label>
            <input
              type="number"
              min="0"
              className={fieldClass}
              value={form.areaMeasure}
              onChange={(e) => setForm((f) => ({ ...f, areaMeasure: e.target.value }))}
            />
          </div>
          <div>
            <label className="ct-field-label">{t("netWorth.form.areaUnit")}</label>
            <select
              className={fieldClass}
              value={form.areaUnit}
              onChange={(e) => setForm((f) => ({ ...f, areaUnit: e.target.value }))}
            >
              {AREA_UNITS.map((u) => (
                <option key={u} value={u}>
                  {t(`netWorth.physical.areaUnitLabel.${u}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {isGold && (
        <div className="ct-grid-2 gap-2">
          <div>
            <label className="ct-field-label">{t("netWorth.form.weightGrams")}</label>
            <input
              type="number"
              min="0"
              className={fieldClass}
              value={form.weightGrams}
              onChange={(e) => setForm((f) => ({ ...f, weightGrams: e.target.value }))}
            />
          </div>
          <div>
            <label className="ct-field-label">{t("netWorth.form.purityKarat")}</label>
            <input
              type="number"
              min="0"
              max="24"
              className={fieldClass}
              value={form.purityKarat}
              onChange={(e) => setForm((f) => ({ ...f, purityKarat: e.target.value }))}
            />
          </div>
        </div>
      )}

      {isVehicle && (
        <>
          <div className="ct-grid-2 gap-2">
            <div>
              <label className="ct-field-label">{t("netWorth.form.vehicleMake")}</label>
              <input
                className={fieldClass}
                value={form.vehicleMake}
                onChange={(e) => setForm((f) => ({ ...f, vehicleMake: e.target.value }))}
                placeholder={t("netWorth.form.vehicleMakePh")}
              />
            </div>
            <div>
              <label className="ct-field-label">{t("netWorth.form.vehicleYear")}</label>
              <input
                type="number"
                min="1980"
                max="2100"
                className={fieldClass}
                value={form.vehicleYear}
                onChange={(e) => setForm((f) => ({ ...f, vehicleYear: e.target.value }))}
              />
            </div>
          </div>
          {vehicleEstimate != null && (
            <div className="ct-stat-tile amber">
              <p className="ct-stat-tile-value text-sm">
                {t("netWorth.physical.vehicleEstimate", { amount: formatInr(vehicleEstimate) })}
              </p>
            </div>
          )}
        </>
      )}

      {form.kind === "liability" && (
        <>
          <div>
            <label className="ct-field-label">{t("netWorth.form.interest")}</label>
            <input
              type="number"
              min="0"
              max="60"
              className={fieldClass}
              value={form.interestRate}
              onChange={(e) => setForm((f) => ({ ...f, interestRate: e.target.value }))}
            />
          </div>
          <div>
            <label className="ct-field-label">{t("netWorth.form.emi")}</label>
            <input
              type="number"
              min="0"
              className={fieldClass}
              value={form.emi}
              onChange={(e) => setForm((f) => ({ ...f, emi: e.target.value }))}
            />
          </div>
        </>
      )}
      <div>
        <label className="ct-field-label">{t("netWorth.form.notes")}</label>
        <textarea
          className={`${fieldClass} min-h-[64px]`}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </div>
      <button type="button" className="ct-btn ct-btn-primary w-full" onClick={submit}>
        {t("common.save")}
      </button>
    </div>
  );
}

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
        key={`${kind}-${entry?.id ?? "new"}-${defaultCategoryId ?? ""}`}
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
