import { useMemo } from "react";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { mergeFinancialLifeItems } from "../../../../utils/mergeFinancialLifeItems.js";
import { Card, Caption, Heading } from "../../../index.js";

/**
 * Single financial-life patterns card — commitment journey + net worth insights.
 * @param {{
 *   hub: ReturnType<import('../../../../hooks/useProfileHubIntel.js').useProfileHubIntel>,
 *   insights: { id: string, key: string, params?: object, tone: string }[],
 *   household?: boolean,
 * }} props
 */
export default function FinancialLifeOverviewPanel({ hub, insights, household = false }) {
  const { t } = useTranslation();
  const items = useMemo(
    () => mergeFinancialLifeItems(hub.journey, insights),
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
    <Card className="ct-nw-panel ct-animate-fade-up">
      <Heading level={3}>
        {household ? t("profileHub.journeyTitleHousehold") : t("profileHub.journeyTitle")}
      </Heading>
      <Caption className="block mt-1">
        {household ? t("profileHub.journeySubtitleHousehold") : t("profileHub.journeySubtitle")}
      </Caption>
      <ul className="ct-stack-sm mt-3">
        {items.map((item) => (
          <li
            key={item.id || item.key}
            className={`ct-nw-insight ct-nw-insight-${toneClass(item.tone)}`}
          >
            {t(item.key, item.params || {})}
          </li>
        ))}
      </ul>
    </Card>
  );
}
