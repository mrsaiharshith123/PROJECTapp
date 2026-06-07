import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { isAdminProfile } from "../services/analytics/adminIntel.js";
import { useTranslation } from "../i18n/I18nProvider.jsx";

/**
 * @param {{ children: import('react').ReactNode }} props
 */
export default function RequireAdmin({ children }) {
  const { t } = useTranslation();
  const { isReady, isLoggedIn, profile, profileResolved } = useAuth();

  if (!isReady || (isLoggedIn && !profileResolved)) {
    return (
      <div className="ct-loader ct-caption" role="status">
        {t("common.loading")}
      </div>
    );
  }

  if (!isLoggedIn || !isAdminProfile(profile)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
