import { useTranslation } from "../../../../i18n/I18nProvider.jsx";
import { Caption, Heading } from "../../../primitives/Text.jsx";

/**
 * @param {{ hub: ReturnType<import('../../../../hooks/useProfileHubIntel.js').useProfileHubIntel> }} props
 */
export default function ProfileJourneyStrip({ hub }) {
  const { t } = useTranslation();
  if (!hub.journey.length) return null;

  return (
    <section className="ct-profile-journey ct-reveal ct-reveal-delay-3">
      <div className="ct-profile-section-head">
        <Heading level={3}>{t("profileHub.journeyTitle")}</Heading>
        <Caption className="block">{t("profileHub.journeySubtitle")}</Caption>
      </div>
      <ul className="ct-profile-journey-list">
        {hub.journey.map((item) => (
          <li key={item.id} className={`ct-profile-journey-item ct-profile-journey-${item.tone}`}>
            <span className="ct-profile-journey-dot" aria-hidden />
            <Caption className="block">{t(item.key, item.params || {})}</Caption>
          </li>
        ))}
      </ul>
    </section>
  );
}
