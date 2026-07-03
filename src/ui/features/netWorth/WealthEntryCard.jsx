import { formatInr } from "../../../constants/symbols.js";
import { getAssetCategory, getLiabilityCategory } from "../../../constants/netWorth/wealthCategories.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import {
  buildAssetDetailLine,
  computeAssetCagr,
  computeGoldAutoValue,
  formatHoldingPeriod,
  isGoldAssetCategory,
  isPhysicalAssetCategory,
  shouldSuggestGoldSync,
} from "../../../utils/netWorth/physicalAssetHelpers.js";
import { estimateVehicleValue } from "../../../utils/vehicleDepreciation.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

export default function WealthEntryCard({
  entry,
  pct = undefined,
  privacyMode,
  onEdit = undefined,
  onDelete = undefined,
  readOnly = false,
  sourceLabel = "",
  onOpen = undefined,
  onAnalyze = undefined,
}) {
  const { t } = useTranslation();
  const { settings } = usePerovo();
  const { updateEntry } = useNetWorth();

  const cat =
    entry.kind === "asset"
      ? getAssetCategory(entry.categoryId)
      : getLiabilityCategory(entry.categoryId);

  const physical = entry.kind === "asset" && isPhysicalAssetCategory(entry.categoryId);
  const isGold = isGoldAssetCategory(entry.categoryId);
  const isVehicle = entry.categoryId === "vehicle";
  const goldAutoValue =
    isGold && !privacyMode ? computeGoldAutoValue(entry.weightGrams, entry.purityKarat, settings.goldRatePerGram) : null;
  const showGoldSync = isGold && !privacyMode && shouldSuggestGoldSync(entry.value, goldAutoValue);
  const vehicleEstimate =
    isVehicle && !privacyMode
      ? estimateVehicleValue({
          purchasePrice: entry.purchasePrice,
          purchaseYear: entry.purchaseYear,
          vehicleYear: entry.vehicleYear,
        })
      : null;
  const showVehicleEstimate =
    vehicleEstimate != null && !privacyMode && Math.abs(vehicleEstimate - (Number(entry.value) || 0)) > 1;
  const cagr =
    physical && !privacyMode
      ? computeAssetCagr(entry.purchasePrice, entry.purchaseYear, entry.value, entry.purchaseMonth)
      : null;
  const detailLine = physical && !privacyMode ? buildAssetDetailLine(entry, t) : "";
  const holding = physical && !privacyMode ? formatHoldingPeriod(entry.purchaseYear, t) : "";
  const amountClass = entry.kind === "asset" ? "ed-amount-pos" : "ed-amount-neg";

  const body = (
    <>
      <div className="ed-row" style={{ padding: 0, border: "none" }}>
        <div className="ed-row-icon">
          <CtIcon name={cat.icon} size={18} />
        </div>
        <div className="ed-row-left">
          <div className="ed-row-title">{entry.name}</div>
          <div className="ed-row-sub">
            {t(cat.labelKey)}
            {sourceLabel ? ` · ${sourceLabel}` : ""}
          </div>
          {detailLine ? (
            <div className="ed-caption" style={{ marginTop: 2 }}>
              {detailLine}
            </div>
          ) : null}
          {holding ? <div className="ed-caption">{holding}</div> : null}
        </div>
        <div className="ed-row-right">
          <div className={`ed-row-value ${amountClass}`}>
            {privacyMode ? "••••" : formatInr(entry.value)}
          </div>
          {pct != null ? <div className="ed-caption">{pct.toFixed(0)}%</div> : null}
          {cagr != null ? (
            <div className={`ed-caption ${cagr >= 0 ? "ed-amount-pos" : "ed-amount-neg"}`}>
              {cagr >= 0 ? "+" : ""}
              {cagr.toFixed(1)}%
            </div>
          ) : null}
        </div>
      </div>

      {showGoldSync && goldAutoValue != null && (
        <div className="ed-metric" style={{ marginTop: 10 }}>
          <p className="ed-caption">{t("netWorth.asset.goldUpdate", { amount: formatInr(goldAutoValue) })}</p>
          {!readOnly && (
            <button
              type="button"
              className="ed-btn-link"
              style={{ marginTop: 4, fontSize: 12 }}
              onClick={() => updateEntry(entry.id, { value: goldAutoValue })}
            >
              {t("netWorth.asset.syncValueCta")}
            </button>
          )}
        </div>
      )}

      {showVehicleEstimate && (
        <div className="ed-metric" style={{ marginTop: 10 }}>
          <p className="ed-caption">
            {t("netWorth.asset.vehicleEstimate", { value: formatInr(vehicleEstimate) })}
          </p>
          {!readOnly && (
            <button
              type="button"
              className="ed-btn-link"
              style={{ marginTop: 4, fontSize: 12 }}
              onClick={() => updateEntry(entry.id, { value: vehicleEstimate })}
            >
              {t("netWorth.asset.syncValueCta")}
            </button>
          )}
        </div>
      )}

      {(Number(entry.emi) || 0) > 0 && (
        <p className="ed-caption" style={{ marginTop: 8 }}>
          {t("netWorth.entry.emi", { amount: privacyMode ? "••••" : formatInr(entry.emi) })}
        </p>
      )}

      {onAnalyze ? (
        <button type="button" className="ed-btn-link" style={{ marginTop: 10, fontSize: 12 }} onClick={onAnalyze}>
          {t("wealthDetail.viewAnalysis")}
        </button>
      ) : null}
    </>
  );

  if (readOnly && onOpen) {
    return (
      <button type="button" className="ed-card ed-card--entry ed-card-press" style={{ width: "100%", textAlign: "left" }} onClick={onOpen}>
        {body}
      </button>
    );
  }

  return (
    <div className="ed-card ed-card--entry">
      {body}
      {!readOnly && (onEdit || onDelete) ? (
        <div className="ed-actions-row" style={{ marginTop: 10, paddingTop: 10, borderTop: "0.5px solid var(--ed-rule)" }}>
          {typeof onEdit === "function" ? (
            <button type="button" className="ed-btn ed-btn-secondary" style={{ flex: 1 }} onClick={() => onEdit(entry)}>
              {t("common.edit")}
            </button>
          ) : null}
          {typeof onDelete === "function" ? (
            <button type="button" className="ed-btn ed-btn-danger ed-btn-sm" onClick={() => onDelete(entry.id)}>
              {t("common.delete")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
