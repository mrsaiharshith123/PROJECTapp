import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { Card, Caption, Heading } from "../../../index.js";

/**
 * Financial journey patterns — shown inside net worth overview.
 * @param {{ hub: ReturnType<import('../../../../hooks/useProfileHubIntel.js').useProfileHubIntel> }} props
 */
export default function ProfileJourneyPanel({ hub }) {
  const { t } = useTranslation();
  if (!hub.journey.length) return null;

  return (
    <Card className="ct-nw-panel ct-animate-fade-up">
      <Heading level={3}>{t("profileHub.journeyTitle")}</Heading>
      <Caption className="block mt-1">{t("profileHub.journeySubtitle")}</Caption>
      <ul className="ct-profile-journey-list mt-3">
        {hub.journey.map((item) => (
          <li key={item.id} className={`ct-profile-journey-item ct-profile-journey-${item.tone}`}>
            <span className="ct-profile-journey-dot" aria-hidden />
            <Caption className="block">{t(item.key, item.params || {})}</Caption>
          </li>
        ))}
      </ul>
    </Card>
  );
}
