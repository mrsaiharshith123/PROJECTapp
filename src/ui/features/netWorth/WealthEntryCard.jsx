import { formatInr } from "../../../constants/symbols.js";
import { getAssetCategory, getLiabilityCategory } from "../../../constants/netWorth/categories.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { Card, Caption, Body } from "../../index.js";

export default function WealthEntryCard({
  entry,
  pct = undefined,
  privacyMode,
  onEdit = undefined,
  onDelete = undefined,
  readOnly = false,
  sourceLabel = "",
  onOpen = undefined,
}) {
  const { t } = useTranslation();
  const cat =
    entry.kind === "asset"
      ? getAssetCategory(entry.categoryId)
      : getLiabilityCategory(entry.categoryId);

  const body = (
    <>
      <div className="ct-row-between gap-2">
        <div className="ct-row gap-3 min-w-0">
          <span className="ct-nw-entry-icon">
            <CtIcon name={cat.icon} size={20} />
          </span>
          <div className="min-w-0">
            <Body className="font-semibold truncate">{entry.name}</Body>
            <Caption>
              {t(cat.labelKey)}
              {sourceLabel ? ` · ${sourceLabel}` : ""}
            </Caption>
          </div>
        </div>
        <div className="text-right shrink-0">
          <Body className="ct-numeral font-bold">
            {privacyMode ? "••••" : formatInr(entry.value)}
          </Body>
          {pct != null && <Caption>{pct.toFixed(0)}%</Caption>}
        </div>
      </div>
      {(Number(entry.emi) || 0) > 0 && (
        <Caption className="mt-2 block">
          {t("netWorth.entry.emi", { amount: privacyMode ? "••••" : formatInr(entry.emi) })}
        </Caption>
      )}
    </>
  );

  if (readOnly && onOpen) {
    return (
      <button type="button" className="ct-nw-entry-btn w-full text-left" onClick={onOpen}>
        <Card className="ct-nw-entry ct-animate-fade-in">{body}</Card>
      </button>
    );
  }

  return (
    <Card className="ct-nw-entry ct-animate-fade-in">
      {body}
      {!readOnly && (
        <div className="ct-row gap-2 mt-3 pt-2 border-t border-[var(--ct-border-subtle)]">
          <button type="button" className="ct-btn ct-btn-ghost ct-btn-sm flex-1" onClick={() => onEdit(entry)}>
            {t("common.edit")}
          </button>
          <button type="button" className="ct-btn ct-btn-ghost ct-btn-sm" onClick={() => onDelete(entry.id)}>
            {t("common.delete")}
          </button>
        </div>
      )}
    </Card>
  );
}
