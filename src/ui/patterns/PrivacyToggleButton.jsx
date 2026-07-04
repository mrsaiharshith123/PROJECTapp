import { useNetWorth } from "../../context/NetWorthContext.jsx";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { CtIcon } from "../icons/CtIcon.jsx";
import { cn } from "../utils/cn.js";

/** Global privacy mode eye toggle — hides sensitive amounts app-wide. */
export function PrivacyToggleButton({ className = "" }) {
  const { privacyMode, togglePrivacyMode } = useNetWorth();
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className={cn("ed-privacy-toggle", className)}
      onClick={togglePrivacyMode}
      aria-pressed={privacyMode}
      aria-label={privacyMode ? t("netWorth.privacy.show") : t("netWorth.privacy.hide")}
    >
      <CtIcon name={privacyMode ? "eye-slash" : "eye"} size={18} />
    </button>
  );
}

export default PrivacyToggleButton;
