import { useMemo } from "react";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { mergeFinancialLifeItems } from "../../../../utils/mergeFinancialLifeItems.js";
import { Eyebrow } from "../../../primitives/Text.jsx";

/**
 * Compact journey patterns — avoids duplicating hero chip metrics (emergency, pressure).
 * @param {{
 *   hub: ReturnType<import('../../../../hooks/useProfileHubIntel.js').useProfileHubIntel>,
 *   insights: { id: string, key: string, params?: object, tone: string }[],
 *   household?: boolean,
 * }} props
 */
export default function FinancialLifeOverviewPanel({ hub, insights, household = false }) {
  const { t } = useTranslation();
  const items = useMemo(
    () => mergeFinancialLifeItems(hub.journey, insights, 3, ["emergency", "pressure"]),
    [hub.journey, insights],
  );
  if (items.length === 0) return null;

  const toneClass = (tone) => {
    if (tone === "action") return "action";
    if (tone === "caution") return "caution";
    if (tone === "neutral" || tone === "calm") return "neutral";
    return "positive";
  };

  return (
    <div className="ct-nw-journey-compact">
      <Eyebrow className="mb-1.5">
        {household ? t("profileHub.journeyTitleHousehold") : t("profileHub.journeyTitle")}
      </Eyebrow>
      <ul className="ct-nw-journey-list">
        {items.map((item) => (
          <li
            key={item.id || item.key}
            className={`ct-nw-insight ct-nw-insight-compact ct-nw-insight-${toneClass(item.tone)}`}
          >
            {t(item.key, item.params || {})}
          </li>
        ))}
      </ul>
    </div>
  );
}
