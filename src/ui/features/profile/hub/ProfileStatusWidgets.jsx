import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { Caption } from "../../../primitives/Text.jsx";
import { CtIcon } from "../../../icons/CtIcon.jsx";

/**
 * @param {{ hub: ReturnType<import('../../../../hooks/useProfileHubIntel.js').useProfileHubIntel> }} props
 */
export default function ProfileStatusWidgets({ hub }) {
  const { t } = useTranslation();

  const widgets = [
    {
      id: "emergency",
      icon: "first-aid",
      label: t("profileHub.widget.emergency"),
      value: hub.emergency ? `${hub.emergency.progressPercent}%` : "—",
      tone: hub.emergency?.tier === "on_track" || hub.emergency?.tier === "almost" ? "positive" : "caution",
    },
    {
      id: "pressure",
      icon: "calendar",
      label: t("profileHub.widget.pressure"),
      value: hub.overdueCount > 0 ? `${hub.overdueCount}` : "0",
      tone: hub.overdueCount > 0 ? "caution" : "positive",
    },
    {
      id: "progress",
      icon: "check",
      label: t("profileHub.widget.progress"),
      value: `${hub.controlScore}`,
      tone: hub.controlScore >= 70 ? "positive" : "neutral",
    },
    {
      id: "pending",
      icon: "clipboard-text",
      label: t("profileHub.widget.pending"),
      value: `${hub.pendingCount}`,
      tone: hub.pendingCount > 0 ? "neutral" : "positive",
    },
  ];

  return (
    <section className="ct-profile-widgets ct-reveal ct-reveal-delay-1" aria-label={t("profileHub.widgetsAria")}>
      <div className="ct-profile-widgets-grid">
        {widgets.map((w) => (
          <div key={w.id} className={`ct-profile-widget ct-profile-widget-${w.tone}`}>
            <span className="ct-profile-widget-icon" aria-hidden>
              <CtIcon name={w.icon} size={20} />
            </span>
            <div className="min-w-0">
              <Caption className="block ct-profile-widget-label">{w.label}</Caption>
              <p className="ct-profile-widget-value">{w.value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
