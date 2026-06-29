import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../../i18n/I18nProvider.js";

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

  const handleBack = backTo ? () => navigate(backTo) : () => navigate("/you");

  return (
    <div className="ct-page ed-you-subpage">
      <div className="ed-you-subpage-header">
        <button
          type="button"
          className="ed-you-back"
          onClick={handleBack}
          aria-label={t("common.back")}
        >
          {t("common.backArrow")}
        </button>
        <h1 className="ed-you-subpage-title">{pageTitle}</h1>
        {action ? <div style={{ flexShrink: 0 }}>{action}</div> : null}
      </div>
      <div style={{ paddingBottom: 8 }}>{children}</div>
    </div>
  );
}
