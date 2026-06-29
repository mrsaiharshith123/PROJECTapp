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
import { Caption, Body } from "../../index.js";

const ED_CARD_WRAP = /** @type {import("react").CSSProperties} */ ({
  background: "transparent",
  border: "0.5px solid var(--ed-rule)",
  borderRadius: 12,
  padding: "12px 14px",
  marginBottom: 8,
  position: "relative",
});

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

  const body = (
    <>
      <div className="ct-row-between gap-2">
        <div className="ct-row gap-3 min-w-0">
          <span className="ct-nw-entry-icon">
            <CtIcon name={cat.icon} size={20} />
          </span>
          <div className="min-w-0">
            <div className="ct-row gap-2 items-center min-w-0">
              <Body className="font-semibold truncate">{entry.name}</Body>
            </div>
            <Caption>
              {t(cat.labelKey)}
              {sourceLabel ? ` · ${sourceLabel}` : ""}
            </Caption>
          </div>
        </div>
        <div className="ct-stat-tile teal shrink-0 text-right min-w-[5rem]">
          <p className="ct-stat-tile-value ct-numeral">
            {privacyMode ? "••••" : formatInr(entry.value)}
          </p>
          {pct != null && <p className="ct-stat-tile-label">{pct.toFixed(0)}%</p>}
          {cagr != null && (
            <span className="ct-trend-chip ct-nw-cagr-chip">
              {cagr >= 0 ? "+" : ""}
              {cagr.toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      {detailLine && <Caption className="mt-2 block truncate">{detailLine}</Caption>}
      {holding && <Caption className="mt-1 block">{holding}</Caption>}

      {showGoldSync && goldAutoValue != null && (
        <div className="ct-nw-value-suggestion mt-2">
          <Caption className="block">
            {t("netWorth.asset.goldUpdate", { amount: formatInr(goldAutoValue) })}
          </Caption>
          {!readOnly && (
            <button
              type="button"
              className="ct-suggestion-link mt-1"
              onClick={() => updateEntry(entry.id, { value: goldAutoValue })}
            >
              {t("netWorth.asset.syncValueCta")}
            </button>
          )}
        </div>
      )}

      {showVehicleEstimate && (
        <div className="ct-nw-value-suggestion mt-2">
          <Caption className="block">
            {t("netWorth.asset.vehicleEstimate", { value: formatInr(vehicleEstimate) })}
          </Caption>
          {!readOnly && (
            <button
              type="button"
              className="ct-suggestion-link mt-1"
              onClick={() => updateEntry(entry.id, { value: vehicleEstimate })}
            >
              {t("netWorth.asset.syncValueCta")}
            </button>
          )}
        </div>
      )}

      {(Number(entry.emi) || 0) > 0 && (
        <Caption className="mt-2 block">
          {t("netWorth.entry.emi", { amount: privacyMode ? "••••" : formatInr(entry.emi) })}
        </Caption>
      )}

      {onAnalyze ? (
        <button type="button" className="ed-ins-link" style={{ marginTop: 10, padding: 0 }} onClick={onAnalyze}>
          {t("wealthDetail.viewAnalysis")}
        </button>
      ) : null}
    </>
  );

  const cardClass = physical ? "ct-nw-entry ct-nw-entry--physical ct-animate-fade-in" : "ct-nw-entry ct-animate-fade-in";

  if (readOnly && onOpen) {
    return (
      <button type="button" className="ct-nw-entry-btn w-full text-left" onClick={onOpen}>
        <div className={cardClass} style={ED_CARD_WRAP}>
          {body}
        </div>
      </button>
    );
  }

  return (
    <div className={cardClass} style={ED_CARD_WRAP}>
      {body}
      {!readOnly && (
        <div className="ct-row gap-2 mt-3 pt-2 border-t border-[var(--ct-border-subtle)]">
          {typeof onEdit === "function" ? (
            <button type="button" className="ct-btn ct-btn-ghost ct-btn-sm flex-1" onClick={() => onEdit(entry)}>
              {t("common.edit")}
            </button>
          ) : null}
          {typeof onDelete === "function" ? (
            <button type="button" className="ct-btn ct-btn-ghost ct-btn-sm" onClick={() => onDelete(entry.id)}>
              {t("common.delete")}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
