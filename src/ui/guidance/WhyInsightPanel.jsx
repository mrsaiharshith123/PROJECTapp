import { useState } from "react";
import { explainInsightI18n } from "../../i18n/insightLabels.js";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { Caption, Body } from "../primitives/Text.jsx";

/**
 * Expandable “why am I seeing this?” for insights.
 * @param {{ insight: { id?: string, key?: string, text?: string, tone?: string, params?: object }, context?: object }} props
 */
export function WhyInsightPanel({ insight, context = {} }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  if (!insight?.id && !insight?.text && !insight?.key) return null;

  const explained = explainInsightI18n(t, insight, context);

  return (
    <div className="ct-guidance-why">
      <button type="button" className="ct-guidance-why-toggle" onClick={() => setOpen((v) => !v)}>
        {open ? t("guidance.explain.hide") : t("guidance.explain.show")}
      </button>
      {open && (
        <div className="ct-guidance-why-body">
          <Body className="!text-xs !font-medium">{explained.headline}</Body>
          <ul className="ct-guidance-why-list">
            {explained.reasons.map((r) => (
              <li key={r}>
                <Caption className="block">{r}</Caption>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default WhyInsightPanel;
