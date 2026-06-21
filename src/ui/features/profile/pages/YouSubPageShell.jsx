import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { CtIcon } from "../../../icons/CtIcon.jsx";

/**
 * @param {{ titleKey?: string, title?: string, children: import('react').ReactNode, action?: import('react').ReactNode }} props
 */
export default function YouSubPageShell({ titleKey, title, children, action }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const pageTitle = titleKey ? t(titleKey) : title || "";

  useEffect(() => {
    document.title = `${pageTitle} — ${t("brand.appName")}`;
    return () => {
      document.title = t("brand.appName");
    };
  }, [pageTitle, t]);

  return (
    <div className="ct-page ct-you-subpage pb-8">
      <header className="ct-subpage-header">
        <button
          type="button"
          className="ct-back-btn"
          onClick={() => navigate("/profile")}
          aria-label={t("common.back")}
        >
          <CtIcon name="arrow-left" size={18} />
        </button>
        <span className="ct-subpage-title">{pageTitle}</span>
        {action ? <span className="ct-subpage-action">{action}</span> : <span className="ct-subpage-spacer" aria-hidden />}
      </header>
      <div className="ct-subpage-content">{children}</div>
    </div>
  );
}
