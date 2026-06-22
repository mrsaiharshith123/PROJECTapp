import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

export default function HomeToolsEntry() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className="ct-settings-row ct-home-tools-entry ct-pressable w-full"
      onClick={() => navigate("/plan")}
    >
      <span className="ct-settings-row-label ct-home-tools-entry-label">{t("home.toolsEntry")}</span>
      <CtIcon name="caret-right" size={14} className="ct-settings-row-caret shrink-0" aria-hidden />
    </button>
  );
}
