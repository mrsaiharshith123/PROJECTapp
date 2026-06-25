import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { CtIcon } from "../icons/CtIcon.jsx";

/**
 * Sticky sub-page title row with back navigation.
 * @param {{ title: string, onBack?: () => void, action?: import('react').ReactNode }} props
 */
export function SubPageHeader({ title, onBack, action }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <header className="ct-subpage-header">
      <button
        type="button"
        className="ct-back-btn"
        onClick={onBack ?? (() => navigate(-1))}
        aria-label={t("common.back")}
      >
        <CtIcon name="arrow-left" size={18} />
      </button>
      <span className="ct-subpage-title">{title}</span>
      {action ? <span className="ct-subpage-action">{action}</span> : <span className="ct-subpage-spacer" aria-hidden />}
    </header>
  );
}

export default SubPageHeader;
