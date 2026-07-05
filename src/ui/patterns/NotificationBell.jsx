import { CtIcon } from "../icons/CtIcon.jsx";
import { useTranslation } from "../../i18n/I18nProvider.js";

export function NotificationBell({ unread = 0, onClick }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      className="ed-notif-bell"
      onClick={onClick}
      aria-label={t("notifications.panel.title")}
    >
      <CtIcon name="bell" size={20} />
      {unread > 0 && <span className="ed-notif-dot">{unread > 9 ? "9+" : unread}</span>}
    </button>
  );
}

export default NotificationBell;
