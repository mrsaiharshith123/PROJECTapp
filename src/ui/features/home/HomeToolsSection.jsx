import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

/** Compact tools entry — full catalogue lives under You → Tools. */
export default function HomeToolsSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="ed-tools ed-tools-compact">
      <button type="button" className="ed-tools-btn" onClick={() => navigate("/you/tools")}>
        <div>
          <div className="ed-tools-label">{t("home.ed.toolsLabel")}</div>
          <div className="ed-tools-text">{t("home.ed.toolsText")}</div>
        </div>
        <CtIcon name="caret-right" size={18} className="ed-tools-arrow" />
      </button>
    </div>
  );
}
