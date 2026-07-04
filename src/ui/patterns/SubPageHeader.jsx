import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { CtIcon } from "../icons/CtIcon.jsx";
import { AppHeaderActions } from "./AppHeaderActions.jsx";

/**
 * Sticky sub-page title row with back navigation.
 * @param {{ title: string, subtitle?: string, onBack?: () => void, action?: import('react').ReactNode, hidePrivacyToggle?: boolean }} props
 */
export function SubPageHeader({ title, subtitle, onBack, action, hidePrivacyToggle = false }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <header className="ed-subpage-header">
      <div className="ed-subpage-header-row">
        <button
          type="button"
          className="ed-subpage-back"
          onClick={onBack ?? (() => navigate(-1))}
          aria-label={t("common.back")}
        >
          <CtIcon name="arrow-left" size={18} />
        </button>
        <span className="ed-subpage-title">{title}</span>
        <span className="ed-subpage-action">
          <AppHeaderActions hidePrivacyToggle={hidePrivacyToggle} action={action} />
        </span>
      </div>
      {subtitle ? <p className="ed-subpage-subtitle">{subtitle}</p> : null}
    </header>
  );
}

export default SubPageHeader;
