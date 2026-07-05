import { useEffect, useState } from "react";
import { CtIcon } from "../icons/CtIcon.jsx";
import { useTranslation } from "../../i18n/I18nProvider.js";

export function useOnlineStatus() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return online;
}

export function OfflineScreen() {
  const { t } = useTranslation();

  return (
    <div className="ed-offline-screen" role="status" aria-live="polite">
      <div className="ed-offline-icon" aria-hidden>
        📡
      </div>
      <div className="ed-offline-copy">
        <h1 className="ed-offline-title">{t("offline.title")}</h1>
        <p className="ed-offline-body">{t("offline.body")}</p>
      </div>
      <div className="ed-inset ed-offline-hint">
        <CtIcon name="cloud" size={16} />
        <span>{t("offline.hint")}</span>
      </div>
    </div>
  );
}
