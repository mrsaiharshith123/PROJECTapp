import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { CHEVRON } from "../../../constants/symbols.js";

export default function HomeToolsEntry() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className="ct-home-tools-entry ct-pressable"
      onClick={() => navigate("/plan")}
    >
      <span className="ct-home-tools-entry-label">{t("home.toolsEntry")}</span>
      <span className="text-[var(--ct-text-muted)]" aria-hidden>
        {CHEVRON}
      </span>
    </button>
  );
}
