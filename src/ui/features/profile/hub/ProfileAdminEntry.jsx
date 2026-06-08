import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext.jsx";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { ToolTile } from "../../ToolTile.jsx";
import { Caption } from "../../../primitives/Text.jsx";

/** Admin-only shortcut to /admin — hidden for everyone else. */
export default function ProfileAdminEntry() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!isAdmin) return null;

  return (
    <section className="ct-profile-admin-entry ct-reveal ct-reveal-delay-3">
      <Caption className="block ct-profile-admin-label">{t("profileHub.adminLabel")}</Caption>
      <div className="ct-profile-admin-tile-wrap">
        <ToolTile
          icon="chart-bar"
          title={t("profileHub.adminTile")}
          onClick={() => navigate("/admin")}
          className="ct-profile-module-tile ct-profile-module-tile-compact ct-profile-admin-tile"
        />
      </div>
    </section>
  );
}
