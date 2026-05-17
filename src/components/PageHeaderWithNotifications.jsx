import { useState } from "react";
import { useCommitIntel } from "../hooks/useCommitIntel.js";
import NotificationPanel from "./NotificationPanel.jsx";

/**
 * Page title row with notification bell — use on Home and Profile only.
 */
export default function PageHeaderWithNotifications({ eyebrow, title, subtitle }) {
  const { notificationUnread } = useCommitIntel();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="text-sm text-gray-400 dark:text-slate-500 font-medium uppercase tracking-widest">
              {eyebrow}
            </p>
          )}
          <h1
            className="text-3xl font-bold text-gray-900 dark:text-slate-100 mt-1"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            {title}
          </h1>
          {subtitle && <div className="mt-1">{subtitle}</div>}
        </div>
        <button
          type="button"
          onClick={() => setShowNotifications((v) => !v)}
          className="relative shrink-0 flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-lg shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800"
          aria-label="Notifications"
        >
          🔔
          {notificationUnread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
              {notificationUnread > 9 ? "9+" : notificationUnread}
            </span>
          )}
        </button>
      </div>
      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
    </>
  );
}
