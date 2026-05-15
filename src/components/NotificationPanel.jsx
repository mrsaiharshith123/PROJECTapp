import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import { useCommitIntel } from "../hooks/useCommitIntel.js";

export default function NotificationPanel({ onClose }) {
  const { markNotificationRead, markAllNotificationsRead } = useCommitTrack();
  const { notifications } = useCommitIntel();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <div className="fixed inset-0 z-[90]" onClick={onClose} aria-hidden />
      <div className="fixed top-16 right-4 md:right-8 z-[95] w-[min(100vw-2rem,22rem)]">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Reminders</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                  {unread} new
                </span>
              )}
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">No reminders right now.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`px-4 py-3 text-sm ${n.read ? "bg-white" : "bg-indigo-50/60"}`}
                  >
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="text-gray-800">{n.message}</p>
                        <p className="text-[10px] uppercase text-gray-400 mt-1 font-semibold">
                          {n.urgency}
                        </p>
                      </div>
                      {!n.read && (
                        <button
                          type="button"
                          onClick={() => markNotificationRead(n.id)}
                          className="text-xs text-indigo-600 font-semibold shrink-0"
                        >
                          Read
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {notifications.length > 0 && unread > 0 && (
            <div className="px-4 py-3 border-t border-gray-100">
              <button
                type="button"
                className="w-full text-xs font-semibold text-indigo-600 py-2"
                onClick={() => markAllNotificationsRead(notifications.map((n) => n.id))}
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
