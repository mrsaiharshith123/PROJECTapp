import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { SubPageHeader } from "../../../patterns/SubPageHeader.jsx";

/**
 * @param {{ titleKey?: string, title?: string, children: import('react').ReactNode, action?: import('react').ReactNode, backTo?: string }} props
 */
export default function YouSubPageShell({ titleKey, title, children, action, backTo }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const pageTitle = titleKey ? t(titleKey) : title || "";

  useEffect(() => {
    document.title = `${pageTitle} — ${t("brand.appName")}`;
    return () => {
      document.title = t("brand.appName");
    };
  }, [pageTitle, t]);

  const handleBack = backTo ? () => navigate(backTo) : undefined;

  return (
    <div className="ct-page ct-you-subpage pb-8">
      <SubPageHeader title={pageTitle} onBack={handleBack} action={action} />
      <div className="ct-subpage-content ct-stack">{children}</div>
    </div>
  );
}
