import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { CtIcon } from "../../../icons/CtIcon.jsx";
import { usePerovo } from "../../../../context/PerovoContext.jsx";
import ProfileNotificationsSection from "../ProfileNotificationsSection.jsx";
import YouSubPageShell from "./YouSubPageShell.jsx";

export default function YouNotificationsPage() {
  const { t } = useTranslation();
  const { settings, updateSettings } = usePerovo();
  return (
    <YouSubPageShell titleKey="settings.row.reminders">
      <div className="ct-stat-tile amber ct-row gap-3 items-center !py-3">
        <span className="ct-icon-tile ct-icon-tile-sm amber shrink-0" aria-hidden>
          <CtIcon name="bell" size={18} weight="duotone" />
        </span>
        <p className="ct-stat-tile-label">{t("settings.group.notifications")}</p>
      </div>
      <ProfileNotificationsSection settings={settings} updateSettings={updateSettings} />
    </YouSubPageShell>
  );
}
