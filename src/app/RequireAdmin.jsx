import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { isAdminProfile } from "../services/analytics/adminIntel.js";
import { SectionLoader } from "../ui/index.js";
import { useTranslation } from "../i18n/I18nProvider.js";

/**
 * @param {{ children: import('react').ReactNode }} props
 */
export default function RequireAdmin({ children }) {
  const { t } = useTranslation();
  const { isReady, isLoggedIn, profile, profileResolved } = useAuth();

  if (!isReady || (isLoggedIn && !profileResolved)) {
    return <SectionLoader message={t("common.loading")} />;
  }

  if (!isLoggedIn || !isAdminProfile(profile)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
