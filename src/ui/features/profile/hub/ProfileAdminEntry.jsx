import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext.jsx";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { SettingsGroup, SettingsGroupRow } from "../SettingsGroup.jsx";

/** Admin-only shortcut to /admin — hidden for everyone else. */
export default function ProfileAdminEntry() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!isAdmin) return null;

  return (
    <section className="ct-profile-admin-entry ct-reveal ct-reveal-delay-3 ct-settings-row-static">
      <SettingsGroup title={t("profileHub.adminLabel")} icon="chart-bar">
        <SettingsGroupRow
          icon="chart-bar"
          iconColor="slate"
          label={t("profileHub.adminTile")}
          onClick={() => navigate("/admin")}
        />
      </SettingsGroup>
    </section>
  );
}
