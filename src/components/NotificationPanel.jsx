import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import { useCommitIntel } from "../hooks/useCommitIntel.js";

export default function NotificationPanel({ onClose }) {
  const panelRef = useRef(null);
  const { markNotificationRead, markAllNotificationsRead } = useCommitTrack();
  const { notifications } = useCommitIntel();
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const onScroll = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      onClose();
    };
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[200] bg-black/20 dark:bg-black/40" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        className="fixed z-[210] w-[min(100vw-2rem,22rem)]"
        style={{ top: "max(4.5rem, env(safe-area-inset-top, 0px) + 3.5rem)", right: "max(1rem, calc(50% - 16rem))" }}
        role="dialog"
        aria-label="Reminders"
      >
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-semibold text-gray-900 dark:text-slate-100">Reminders</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <span className="text-xs bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-semibold">
                  {unread} new
                </span>
              )}
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-lg leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto overscroll-contain">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-slate-400 py-6 text-center">No reminders right now.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-slate-800">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`px-4 py-3 text-sm ${n.read ? "bg-white dark:bg-slate-900" : "bg-indigo-50/60 dark:bg-indigo-950/40"}`}
                  >
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="text-gray-800 dark:text-slate-200">{n.message}</p>
                        <p className="text-[10px] uppercase text-gray-400 dark:text-slate-500 mt-1 font-semibold">
                          {n.urgency}
                        </p>
                      </div>
                      {!n.read && (
                        <button
                          type="button"
                          onClick={() => markNotificationRead(n.id)}
                          className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold shrink-0"
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
            <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700">
              <button
                type="button"
                className="w-full text-xs font-semibold text-indigo-600 dark:text-indigo-400 py-2"
                onClick={() => markAllNotificationsRead(notifications.map((n) => n.id))}
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
