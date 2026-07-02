import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { CtIcon } from "../icons/CtIcon.jsx";
import { ADMIN_UI_ENABLED } from "../../constants/featureFlags.js";

/** Admin-only shortcut to /admin — left FAB (replaces legacy dev spanner). */
export function AdminFloatingButton() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  if (!ADMIN_UI_ENABLED || !isAdmin) return null;
  if (location.pathname.startsWith("/admin")) return null;

  return (
    <button
      type="button"
      className="ct-admin-fab"
      onClick={() => navigate("/admin")}
      aria-label={t("admin.fabAria")}
      title={t("admin.title")}
    >
      <CtIcon name="chart-bar" size={16} />
    </button>
  );
}
