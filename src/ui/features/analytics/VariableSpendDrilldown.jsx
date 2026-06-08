import { formatInr } from "../../../constants/symbols.js";
import { useTranslation } from "../../../i18n/I18nProvider.jsx";
import { getTransactionLifeCategoryMeta } from "../../../constants/transactionCategories.js";
import { Card } from "../../primitives/Card.jsx";
import { Body, Caption, Heading } from "../../primitives/Text.jsx";
import { Button } from "../../primitives/Button.jsx";

/** Expanded breakdown after tapping variable spend on a chart. */
export default function VariableSpendDrilldown({ monthLabel, drilldown, onClose }) {
  const { t } = useTranslation();
  if (!drilldown || drilldown.total <= 0) return null;

  return (
    <Card variant="flat" className="ct-stack ct-insight-accent">
      <div className="ct-row-between gap-2">
        <div>
          <Heading level={4}>{t("charts.drilldownTitle", { month: monthLabel })}</Heading>
          <Caption className="block mt-0.5">
            {t("charts.drilldownTotal", { amount: formatInr(drilldown.total) })}
          </Caption>
        </div>
        <Button type="button" variant="ghost" size="sm" className="!w-auto" onClick={onClose}>
          {t("common.close")}
        </Button>
      </div>

      {drilldown.merchants.length > 0 && (
        <div>
          <Body className="text-xs font-semibold mb-1">{t("charts.drilldownMerchants")}</Body>
          <ul className="ct-stack-sm">
            {drilldown.merchants.map((m) => (
              <li key={m.name} className="ct-row-between ct-caption">
                <span className="truncate pr-2">{m.name}</span>
                <span className="font-semibold shrink-0">
                  {formatInr(m.amount)}
                  {m.count > 1 ? ` · ${m.count}×` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {drilldown.categories.length > 0 && (
        <div>
          <Body className="text-xs font-semibold mb-1">{t("charts.drilldownCategories")}</Body>
          <ul className="ct-stack-sm">
            {drilldown.categories.map((c) => (
              <li key={c.lifeCategory} className="ct-row-between ct-caption">
                <span>{c.name}</span>
                <span className="font-semibold shrink-0">{formatInr(c.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {drilldown.entries.length > 0 && (
        <div>
          <Body className="text-xs font-semibold mb-1">{t("charts.drilldownTopEntries")}</Body>
          <ul className="ct-stack-sm">
            {drilldown.entries.map((e) => (
              <li key={e.id} className="ct-row-between ct-caption gap-2">
                <span className="truncate">
                  {e.label}
                  <span className="opacity-70"> · {getTransactionLifeCategoryMeta(e.lifeCategory).label}</span>
                </span>
                <span className="font-semibold shrink-0">{formatInr(e.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
