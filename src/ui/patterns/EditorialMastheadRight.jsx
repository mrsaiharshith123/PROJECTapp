import { useMemo, useState } from "react";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { useCommitIntel } from "../../hooks/useCommitIntel.js";
import HomeEditorialAvatar from "../features/home/HomeEditorialAvatar.jsx";
import { NotificationPanel } from "../features/NotificationPanel.jsx";
import { NotificationBell } from "./NotificationBell.jsx";

function formatMastheadDate(locale) {
  const today = new Date();
  const dateLocale = locale === "en" ? "en-IN" : locale;
  return {
    dayName: today.toLocaleDateString(dateLocale, { weekday: "long" }),
    dateStr: today.toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" }),
  };
}

/** Date, notification bell, and profile avatar — shared editorial masthead right cluster. */
export function EditorialMastheadRight({ tier = "free" }) {
  const { locale } = useTranslation();
  const { notificationUnread } = useCommitIntel();
  const [showNotifications, setShowNotifications] = useState(false);
  const { dayName, dateStr } = useMemo(() => formatMastheadDate(locale), [locale]);

  return (
    <>
      <div className="ed-masthead-right">
        <div className="ed-date">
          {dayName}
          <br />
          {dateStr}
        </div>
        <NotificationBell unread={notificationUnread} onClick={() => setShowNotifications((v) => !v)} />
        <HomeEditorialAvatar tier={tier} />
      </div>
      {showNotifications ? <NotificationPanel onClose={() => setShowNotifications(false)} /> : null}
    </>
  );
}

export default EditorialMastheadRight;
