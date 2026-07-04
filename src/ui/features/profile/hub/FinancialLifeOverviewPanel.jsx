import { useMemo } from "react";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { mergeFinancialLifeItems } from "../../../../utils/mergeFinancialLifeItems.js";
import { SettingsGroup, SettingsGroupContent } from "../SettingsGroup.jsx";

/**
 * Compact journey patterns — avoids duplicating hero chip metrics (emergency, pressure).
 * @param {{
 *   hub: ReturnType<import('../../../../hooks/useProfileHubIntel.js').useProfileHubIntel>,
 *   insights: { id: string, key: string, params?: object, tone: string }[],
 * }} props
 */
export default function FinancialLifeOverviewPanel({ hub, insights }) {
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
    <SettingsGroup
      title={t("profileHub.journeyTitle")}
      icon="lightning"
    >
      <SettingsGroupContent className="!pt-2">
        <ul className="ed-nw-journey-list">
          {items.map((item) => (
            <li
              key={item.id || item.key}
              className={`ed-inset ed-nw-insight ed-nw-insight-compact ed-nw-insight-${toneClass(item.tone)}`}
            >
              {t(item.key, item.params || {})}
            </li>
          ))}
        </ul>
      </SettingsGroupContent>
    </SettingsGroup>
  );
}
