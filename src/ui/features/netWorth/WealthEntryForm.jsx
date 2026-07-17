import { useEffect, useMemo, useRef, useState } from "react";
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
} from "../../../constants/netWorth/assetFormCategories.js";
import { fetchPropertyAiBundle } from "../../../services/ai/assetInsight.js";
import { VALUE_HISTORY_ALGO_VERSION } from "../../../utils/netWorth/propertyValueHistory.js";
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
import { useFormValidation } from "../../../hooks/useFormValidation.js";
import { AREA_UNITS, entryToForm, isPhysicalCategory, MONTH_OPTIONS, resolveEntryName } from "./wealthEntryFormState.js";
import WealthEntryExtendedFields from "./WealthEntryExtendedFields.jsx";

export default function WealthEntryForm({ kind, entry, defaultCategoryId, restrictedCategories, onClose, onSave }) {
  const { t } = useTranslation();
  const { settings, refreshGoldRate } = usePerovo();
  const { register, validate, errors: fieldErrors, clearError } = useFormValidation();
  const [form, setForm] = useState(() => entryToForm(entry, kind, defaultCategoryId));
  const [saving, setSaving] = useState(false);
  const [goldRateLoading, setGoldRateLoading] = useState(false);
  const [propertySaveError, setPropertySaveError] = useState("");
  const savingRef = useRef(false);

  const categories =
    form.kind === "asset"
      ? getAssetFormPickerCategories(restrictedCategories ?? CORE_ASSET_CATEGORIES, "asset")
      : (restrictedCategories ?? LIABILITY_CATEGORIES);

  const storedCategoryId = useMemo(
    () => resolveStoredCategoryId(form.categoryId, form.assetSubtype),
    [form.categoryId, form.assetSubtype],
  );

  const fieldClass = inputClassName();
  const physical = form.kind === "asset" && isPhysicalCategory(storedCategoryId);
  const isProperty = PROPERTY_STORED_IDS.has(storedCategoryId);
  const isResidential = isResidentialProperty(storedCategoryId);
  const isVehicle = storedCategoryId === "vehicle";
  const isGold = storedCategoryId === "gold";
  const isBusiness = storedCategoryId === "business";
  const isStock = storedCategoryId === "stocks";
  const isMutualFund = storedCategoryId === "mutual_fund" || storedCategoryId === "sip";
  const isCrypto = storedCategoryId === "crypto";
  const isFdInstrument = ["fd", "rd"].includes(storedCategoryId);
  const showGrowthHistory = !isProperty && physical;
  const includePurchaseHistory = isProperty || form.trackGrowth || isStock || isMutualFund || isCrypto;
  const extendedFieldsBeforeValue = isStock || form.kind === "liability";

  const propertyPurchaseTotal = useMemo(() => {
    if (!isProperty) return null;
    return computePurchasePriceFromRate(Number(form.purchaseRatePerUnit), Number(form.areaMeasure));
  }, [isProperty, form.purchaseRatePerUnit, form.areaMeasure]);

  const propertyHasLocation =
    Boolean(form.location?.trim()) || (form.latitude != null && form.longitude != null);

  const goldRatePerGram = settings.goldRatePerGram;

  const goldEstimatedValue = useMemo(() => {
    if (!isGold || !goldRatePerGram) return null;
    return computeGoldAutoValue(
      Number(form.weightGrams),
      Number(form.purityKarat),
      goldRatePerGram,
    );
  }, [isGold, form.weightGrams, form.purityKarat, goldRatePerGram]);

  const goldCanDeferValue =
    isGold &&
    !form.valueManual &&
    !goldEstimatedValue &&
    Number(form.weightGrams) > 0;

  useEffect(() => {
    if (!isGold || !isGoldApiConfigured() || !refreshGoldRate) return;
    if (!shouldRefreshGoldRate(settings.goldRateLastFetched, settings.goldRatePerGram)) return;
    let cancelled = false;
    queueMicrotask(() => setGoldRateLoading(true));
    refreshGoldRate()
      .catch(() => false)
      .finally(() => {
        if (!cancelled) setGoldRateLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    isGold,
    settings.goldRateLastFetched,
    settings.goldRatePerGram,
    refreshGoldRate,
  ]);

  const effectiveValue = useMemo(() => {
    if (isProperty && !form.valueManual && entry?.value) return entry.value;
    if (isGold && !form.valueManual && goldEstimatedValue) return goldEstimatedValue;
    return Number(form.value) || 0;
  }, [
    isProperty,
    isGold,
    form.valueManual,
    entry?.value,
    goldEstimatedValue,
    form.value,
  ]);

  const cagr = useMemo(() => {
    if (!includePurchaseHistory) return null;
    if (!physical && !isGold) return null;
    const price = isProperty ? propertyPurchaseTotal : Number(form.purchasePrice);
    const year = Number(form.purchaseYear);
    if (!price || !year || !effectiveValue) return null;
    return computeAssetCagr(
      price,
      year,
      effectiveValue,
      isProperty ? Number(form.purchaseMonth) || 1 : 1,
    );
  }, [
    includePurchaseHistory,
    physical,
    isGold,
    isProperty,
    propertyPurchaseTotal,
    form.purchasePrice,
    form.purchaseYear,
    form.purchaseMonth,
    effectiveValue,
  ]);

  const vehicleEstimate = useMemo(() => {
    if (!isVehicle || !form.trackGrowth) return null;
    const price = Number(form.purchasePrice);
    if (!price) return null;
    return estimateVehicleValue({
      purchasePrice: price,
      purchaseYear: Number(form.purchaseYear) || undefined,
      vehicleYear: Number(form.vehicleYear) || undefined,
    });
  }, [isVehicle, form.purchasePrice, form.purchaseYear, form.vehicleYear, form.trackGrowth]);

  const submit = async () => {
    if (savingRef.current) return;

    const showValueInput =
      !(isProperty && !form.valueManual) &&
      !(isGold && !form.valueManual && (goldEstimatedValue || goldCanDeferValue));

    if (showValueInput) {
      const ok = validate({
        value: {
          required: true,
          label: t("netWorth.form.value"),
          getValue: () => form.value,
        },
      });
      if (!ok) return;
    }

    let resolvedValue = Number(form.value);
    /** @type {Record<string, unknown>} */
    let propertyAiPayload = {};

    if (isProperty && !form.valueManual) {
      if (!propertyHasLocation) return;
      const area = Number(form.areaMeasure);
      if (!area || area <= 0) return;

      savingRef.current = true;
      setSaving(true);
      setPropertySaveError("");

      const result = await fetchPropertyAiBundle({
        categoryId: storedCategoryId,
        name: form.name,
        location: form.location.trim(),
        latitude: form.latitude,
        longitude: form.longitude,
        purchaseYear: form.purchaseYear !== "" ? Number(form.purchaseYear) : null,
        purchaseMonth: form.purchaseMonth !== "" ? Number(form.purchaseMonth) : null,
        purchasePrice: propertyPurchaseTotal,
        purchaseRatePerUnit:
          form.purchaseRatePerUnit !== "" ? Number(form.purchaseRatePerUnit) : undefined,
        areaMeasure: area,
        areaUnit: form.areaUnit,
      });

      if (!result.ok) {
        setPropertySaveError(
          result.errorCode === "unauthorized"
            ? t("netWorth.form.propertyAiNeedAuth")
            : t("netWorth.form.propertyAiFailed"),
        );
        savingRef.current = false;
        setSaving(false);
        return;
      }

      resolvedValue = result.value;
      propertyAiPayload = {
        marketRatePerSqyd: result.marketRatePerSqyd,
        marketAnnualGrowthPct: result.annualGrowthPct ?? undefined,
        valueAiFetchedAt: Date.now(),
      };
      if (result.series?.length) {
        propertyAiPayload.valueHistorySeries = result.series;
        propertyAiPayload.valueHistoryFetchedAt = Date.now();
        propertyAiPayload.valueHistoryAlgoVersion = VALUE_HISTORY_ALGO_VERSION;
      }
    } else if (isGold && !form.valueManual && goldEstimatedValue) {
      resolvedValue = goldEstimatedValue;
    } else if (isGold && goldCanDeferValue) {
      resolvedValue = 0;
    } else if (!resolvedValue && !goldCanDeferValue) {
      return;
    }

    if (!isProperty || form.valueManual) {
      if (!resolvedValue && !goldCanDeferValue) return;
    }

    savingRef.current = true;
    setSaving(true);

    /** @type {Record<string, unknown>} */
    const payload = {
      kind: form.kind,
      categoryId: storedCategoryId,
      name: resolveEntryName(form.name, storedCategoryId, form.kind, t),
      value: goldCanDeferValue ? 0 : resolvedValue,
      notes: form.notes.trim(),
      interestRate: form.interestRate !== "" ? Number(form.interestRate) : undefined,
      emi: form.emi !== "" ? Number(form.emi) : undefined,
      ...propertyAiPayload,
    };

    if (physical || isGold) {
      Object.assign(payload, {
        purchaseYear:
          includePurchaseHistory && form.purchaseYear !== "" ? Number(form.purchaseYear) : undefined,
        purchaseMonth:
          isProperty && form.purchaseMonth !== "" ? Number(form.purchaseMonth) : undefined,
        purchasePrice: !includePurchaseHistory
          ? undefined
          : isProperty && propertyPurchaseTotal
            ? propertyPurchaseTotal
            : form.purchasePrice !== ""
              ? Number(form.purchasePrice)
              : undefined,
        purchaseRatePerUnit:
          isProperty && form.purchaseRatePerUnit !== ""
            ? Number(form.purchaseRatePerUnit)
            : undefined,
        valueAutoEstimated:
          (isProperty && !form.valueManual) ||
          (isGold && !form.valueManual && (Boolean(goldEstimatedValue) || goldCanDeferValue)),
        location: form.location.trim() || undefined,
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
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

    if (isStock) {
      Object.assign(payload, {
        ticker: form.ticker.trim() || undefined,
        exchange: form.exchange || "NSE",
        quantity: form.quantity !== "" ? Number(form.quantity) : undefined,
        buyPrice: form.buyPrice !== "" ? Number(form.buyPrice) : undefined,
        corporateActions:
          form.corporateActions?.length > 0
            ? form.corporateActions.filter((a) => a.type)
            : undefined,
        purchaseYear: form.purchaseYear !== "" ? Number(form.purchaseYear) : undefined,
        purchasePrice:
          form.buyPrice !== "" && form.quantity !== ""
            ? Number(form.buyPrice) * Number(form.quantity)
            : form.purchasePrice !== ""
              ? Number(form.purchasePrice)
              : undefined,
      });
    }

    if (isMutualFund) {
      Object.assign(payload, {
        fundSubType: form.fundSubType || "equity",
        monthlySip: form.monthlySip !== "" ? Number(form.monthlySip) : undefined,
        folio: form.folio.trim() || undefined,
        purchaseYear: form.purchaseYear !== "" ? Number(form.purchaseYear) : undefined,
        purchasePrice: form.purchasePrice !== "" ? Number(form.purchasePrice) : undefined,
      });
    }

    if (isCrypto) {
      Object.assign(payload, {
        purchaseYear: form.purchaseYear !== "" ? Number(form.purchaseYear) : undefined,
        purchasePrice: form.purchasePrice !== "" ? Number(form.purchasePrice) : undefined,
      });
    }

    if (isFdInstrument) {
      Object.assign(payload, {
        interestRate: form.interestRate !== "" ? Number(form.interestRate) : undefined,
        maturityDate: form.maturityDate || undefined,
        purchasePrice: form.purchasePrice !== "" ? Number(form.purchasePrice) : undefined,
        purchaseYear: form.purchaseYear !== "" ? Number(form.purchaseYear) : undefined,
      });
    }

    if (form.kind === "liability") {
      Object.assign(payload, {
        originalLoanAmount:
          form.originalLoanAmount !== "" ? Number(form.originalLoanAmount) : undefined,
        purchasePrice:
          form.originalLoanAmount !== "" ? Number(form.originalLoanAmount) : payload.purchasePrice,
      });
    }

    onSave(payload);
    onClose();
    queueMicrotask(() => {
      savingRef.current = false;
      setSaving(false);
    });
  };

  return (
    <div className="ed-section">
      <div>
        <label className="ed-field-label">{t("netWorth.form.category")}</label>
        <select
          className={fieldClass}
          value={form.categoryId}
          onChange={(e) => {
            const next = e.target.value;
            setForm((f) => ({
              ...f,
              categoryId: next,
              assetSubtype: defaultSubtypeForPicker(next),
            }));
          }}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {t(c.labelKey)}
            </option>
          ))}
        </select>
      </div>

      {form.kind === "asset" && form.categoryId === PROPERTY_PICKER_ID && (
        <div>
          <label className="ed-field-label">{t("netWorth.form.propertySubtype")}</label>
          <select
            className={fieldClass}
            value={form.assetSubtype}
            onChange={(e) => setForm((f) => ({ ...f, assetSubtype: e.target.value }))}
          >
            {PROPERTY_FORM_SUBTYPES.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {t(sub.labelKey)}
              </option>
            ))}
          </select>
        </div>
      )}

      {form.kind === "asset" && form.categoryId === LIQUID_PICKER_ID && (
        <div>
          <label className="ed-field-label">{t("netWorth.form.assetSubtype")}</label>
          <select
            className={fieldClass}
            value={form.assetSubtype}
            onChange={(e) => setForm((f) => ({ ...f, assetSubtype: e.target.value }))}
          >
            {LIQUID_FORM_SUBTYPES.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {t(sub.labelKey)}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="ed-field-label">
          {form.kind === "asset" ? t("netWorth.form.nameOptional") : t("netWorth.form.name")}
        </label>
        <input
          className={fieldClass}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder={t("netWorth.form.namePh")}
        />
      </div>

      {isGold && (
        <div className="ed-grid-2 gap-2">
          <div>
            <label className="ed-field-label">{t("netWorth.form.weightGrams")}</label>
            <input
              type="number"
              min="0"
              className={fieldClass}
              value={form.weightGrams}
              onChange={(e) => setForm((f) => ({ ...f, weightGrams: e.target.value }))}
            />
          </div>
          <div>
            <label className="ed-field-label">{t("netWorth.form.purityKarat")}</label>
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

      {extendedFieldsBeforeValue && (
        <WealthEntryExtendedFields
          form={form}
          setForm={setForm}
          fieldClass={fieldClass}
          t={t}
          isStock={isStock}
          isMutualFund={isMutualFund}
          isCrypto={isCrypto}
          isFdInstrument={isFdInstrument}
        />
      )}

      {!(isProperty && !form.valueManual) &&
        !(isGold && !form.valueManual && (goldEstimatedValue || goldCanDeferValue)) && (
        <div>
          <label className="ed-field-label">{t("netWorth.form.value")}</label>
          <input
            ref={register("value")}
            type="number"
            min="0"
            className={`${fieldClass}${fieldErrors.value ? " error" : ""}`}
            value={form.value}
            onChange={(e) => {
              setForm((f) => ({ ...f, value: e.target.value }));
              clearError("value");
            }}
          />
          {fieldErrors.value ? <div className="ed-field-error">{fieldErrors.value}</div> : null}
        </div>
      )}

      {isProperty && !form.valueManual && (
        <>
          {!propertyHasLocation ? (
            <p className="text-xs text-[var(--ed-ink-faint)]">{t("netWorth.form.propertyAiNeedLocation")}</p>
          ) : (
            <p className="text-xs text-[var(--ed-ink-faint)]">{t("netWorth.form.propertyAiOnSave")}</p>
          )}
          {propertySaveError ? (
            <p className="text-xs" style={{ color: "var(--ed-red)" }}>
              {propertySaveError}
            </p>
          ) : null}
        </>
      )}

      {isProperty && (
        <label className="ed-row gap-2 items-center text-sm">
          <input
            type="checkbox"
            checked={form.valueManual}
            onChange={(e) => setForm((f) => ({ ...f, valueManual: e.target.checked }))}
          />
          {t("netWorth.form.valueManualOverride")}
        </label>
      )}

      {isGold && goldEstimatedValue != null && !form.valueManual && (
        <div className="ed-metric">
          <p className="ed-metric-label">{t("netWorth.form.estimatedValueToday")}</p>
          <p className="ed-metric-value">{formatInr(goldEstimatedValue)}</p>
          <p className="ed-metric-label text-xs mt-1">
            {t("netWorth.form.goldEstimatedValueHint", {
              rate: formatInr(goldRatePerGram),
              karat: Number(form.purityKarat) || 24,
            })}
          </p>
        </div>
      )}

      {isGold && goldCanDeferValue && (
        <div className="ed-metric">
          <p className="ed-metric-value text-sm">{t("netWorth.form.goldRatePendingSave")}</p>
        </div>
      )}

      {isGold && goldRateLoading && !goldRatePerGram && (
        <p className="text-xs text-[var(--ed-ink-faint)]">{t("netWorth.form.goldRateFetching")}</p>
      )}

      {isGold && !goldRatePerGram && !goldRateLoading && form.weightGrams && !isGoldApiConfigured() && (
        <p className="text-xs text-[var(--ed-ink-faint)]">{t("netWorth.form.goldRateNotConfigured")}</p>
      )}

      {isGold && !goldRatePerGram && !goldRateLoading && form.weightGrams && isGoldApiConfigured() && form.valueManual && (
        <p className="text-xs text-[var(--ed-ink-faint)]">{t("netWorth.form.goldRateUnavailable")}</p>
      )}

      {isGold && (
        <label className="ed-row gap-2 items-center text-sm">
          <input
            type="checkbox"
            checked={form.valueManual}
            onChange={(e) => setForm((f) => ({ ...f, valueManual: e.target.checked }))}
          />
          {t("netWorth.form.valueManualOverride")}
        </label>
      )}

      {showGrowthHistory && (
        <>
          <label className="ed-row gap-2 items-center text-sm">
            <input
              type="checkbox"
              checked={form.trackGrowth}
              onChange={(e) => setForm((f) => ({ ...f, trackGrowth: e.target.checked }))}
            />
            {t("netWorth.form.trackGrowth")}
          </label>
          {form.trackGrowth && (
            <>
              <div className="ed-grid-2 gap-2">
                <div>
                  <label className="ed-field-label">{t("netWorth.form.purchaseYear")}</label>
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
                  <label className="ed-field-label">{t("netWorth.form.purchasePrice")}</label>
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
                <div className="ed-metric">
                  <p className="ed-metric-value text-sm">
                    {t("netWorth.physical.cagrHint", {
                      pct: `${cagr >= 0 ? "+" : ""}${cagr.toFixed(1)}`,
                    })}
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {isProperty && (
        <>
          <div className="ed-grid-2 gap-2">
            <div>
              <label className="ed-field-label">{t("netWorth.form.purchaseMonth")}</label>
              <select
                className={fieldClass}
                value={form.purchaseMonth}
                onChange={(e) => setForm((f) => ({ ...f, purchaseMonth: e.target.value }))}
              >
                <option value="">{t("netWorth.form.purchaseMonthPh")}</option>
                {MONTH_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {t(`netWorth.form.month.${m}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="ed-field-label">{t("netWorth.form.purchaseYear")}</label>
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
          </div>
          <div className="ed-grid-2 gap-2">
            <div>
              <label className="ed-field-label">{t("netWorth.form.ratePerSqYard")}</label>
              <input
                type="number"
                min="0"
                className={fieldClass}
                value={form.purchaseRatePerUnit}
                onChange={(e) => setForm((f) => ({ ...f, purchaseRatePerUnit: e.target.value }))}
                placeholder={t("netWorth.form.ratePerSqYardPh")}
              />
            </div>
            <div>
              <label className="ed-field-label">{t("netWorth.form.areaSqYards")}</label>
              <input
                type="number"
                min="0"
                className={fieldClass}
                value={form.areaMeasure}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    areaMeasure: e.target.value,
                    areaUnit: isResidential ? "sqyd" : f.areaUnit,
                  }))
                }
                placeholder={t("netWorth.form.areaSqYardsPh")}
              />
            </div>
          </div>
          {propertyPurchaseTotal != null && (
            <div className="ed-metric">
              <p className="ed-metric-label">{t("netWorth.form.purchaseTotalThen")}</p>
              <p className="ed-metric-value">{formatInr(propertyPurchaseTotal)}</p>
            </div>
          )}
          {cagr != null && (
            <div className="ed-metric">
              <p className="ed-metric-value text-sm">
                {t("netWorth.physical.cagrHint", { pct: `${cagr >= 0 ? "+" : ""}${cagr.toFixed(1)}` })}
              </p>
            </div>
          )}
        </>
      )}

      {isProperty && (
        <>
          <LocationMapPicker
            latitude={form.latitude}
            longitude={form.longitude}
            locationLabel={form.location}
            defaultCityId={settings.userCity}
            onChange={(patch) =>
              setForm((f) => ({
                ...f,
                ...(patch.location != null ? { location: patch.location } : {}),
                ...(patch.latitude != null ? { latitude: patch.latitude } : {}),
                ...(patch.longitude != null ? { longitude: patch.longitude } : {}),
              }))
            }
          />
          <div>
            <label className="ed-field-label">{t("netWorth.form.location")}</label>
            <input
              className={fieldClass}
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder={t("netWorth.form.locationPh")}
            />
          </div>
        </>
      )}

      {(isBusiness && !isProperty) && (
        <div>
          <label className="ed-field-label">{t("netWorth.form.location")}</label>
          <input
            className={fieldClass}
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            placeholder={t("netWorth.form.locationPh")}
          />
        </div>
      )}

      {isProperty && !isResidential && (
        <div className="ed-grid-2 gap-2">
          <div>
            <label className="ed-field-label">{t("netWorth.form.areaMeasure")}</label>
            <input
              type="number"
              min="0"
              className={fieldClass}
              value={form.areaMeasure}
              onChange={(e) => setForm((f) => ({ ...f, areaMeasure: e.target.value }))}
            />
          </div>
          <div>
            <label className="ed-field-label">{t("netWorth.form.areaUnit")}</label>
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

      {isVehicle && (
        <>
          <div className="ed-grid-2 gap-2">
            <div>
              <label className="ed-field-label">{t("netWorth.form.vehicleMake")}</label>
              <input
                className={fieldClass}
                value={form.vehicleMake}
                onChange={(e) => setForm((f) => ({ ...f, vehicleMake: e.target.value }))}
                placeholder={t("netWorth.form.vehicleMakePh")}
              />
            </div>
            <div>
              <label className="ed-field-label">{t("netWorth.form.vehicleYear")}</label>
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
            <div className="ed-metric">
              <p className="ed-metric-value text-sm">
                {t("netWorth.physical.vehicleEstimate", { amount: formatInr(vehicleEstimate) })}
              </p>
            </div>
          )}
        </>
      )}

      {!extendedFieldsBeforeValue && (
        <WealthEntryExtendedFields
          form={form}
          setForm={setForm}
          fieldClass={fieldClass}
          t={t}
          isStock={isStock}
          isMutualFund={isMutualFund}
          isCrypto={isCrypto}
          isFdInstrument={isFdInstrument}
        />
      )}
      <div>
        <label className="ed-field-label">{t("netWorth.form.notes")}</label>
        <textarea
          className={`${fieldClass} min-h-[64px]`}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </div>
      <button type="button" className="ed-btn ed-btn-primary ed-btn-block" disabled={saving} onClick={submit}>
        {saving ? t("common.loading") : t("common.save")}
      </button>
    </div>
  );
}
