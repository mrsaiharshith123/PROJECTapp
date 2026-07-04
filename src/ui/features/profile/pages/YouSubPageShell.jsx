import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import EditorialSubMasthead from "../../../patterns/EditorialSubMasthead.jsx";

/**
 * @param {{ titleKey?: string, titleParams?: Record<string, unknown>, title?: string, children: import('react').ReactNode, action?: import('react').ReactNode, backTo?: string }} props
 */
export default function YouSubPageShell({ titleKey, titleParams, title, children, action, backTo }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const pageTitle = titleKey
    ? t(titleKey, { appName: t("brand.appName"), ...titleParams })
    : title || "";

  useEffect(() => {
    document.title = `${pageTitle} — ${t("brand.appName")}`;
    return () => {
      document.title = t("brand.appName");
    };
  }, [pageTitle, t]);

  const handleBack = backTo ? () => navigate(backTo) : () => navigate("/you");

  return (
    <div className="ed-page-full ed-you-subpage">
      <EditorialSubMasthead
        title={pageTitle}
        onBack={handleBack}
        backLabel={t("common.backArrow")}
        right={action}
      />
      <div className="ed-you-subpage-body">{children}</div>
    </div>
  );
}
