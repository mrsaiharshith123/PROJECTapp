import { useState } from "react";
import { Card } from "../../../ui";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  isNotificationSupported,
  registerPeriodicReminderSync,
  requestServiceWorkerReminderFlush,
} from "../../../services/notifications/index.js";

export default function ProfileNotificationsSection({ settings, updateSettings }) {
  const { pushInAppNotification } = useCommitTrack();
  const supported = isNotificationSupported();
  const [, setPermRefresh] = useState(0);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const perm = supported ? getNotificationPermission() : "unsupported";
  const bumpPerm = () => setPermRefresh((n) => n + 1);

  const handleEnable = async () => {
    setBusy(true);
    setStatus(null);
    const result = await requestNotificationPermission();
    bumpPerm();
    setBusy(false);
    if (result === "granted") {
      await registerPeriodicReminderSync();
      setStatus({
        type: "ok",
        text: "Browser alerts enabled. Add app to Home Screen for alerts when the app is closed.",
      });
    } else if (result === "denied") {
      setStatus({
        type: "err",
        text: "Blocked in browser settings. Allow notifications for this site, then try again.",
      });
    }
  };

  const handleTest = async () => {
    setBusy(true);
    setStatus(null);
    const result = await sendTestNotification();
    bumpPerm();

    if (result.ok) {
      await requestServiceWorkerReminderFlush();
      pushInAppNotification({
        id: `test-${Date.now()}`,
        message: "Test reminder — notifications are working on this device.",
        urgency: "normal",
      });
      setStatus({
        type: "ok",
        text: "Sent to your system notification panel and the in-app bell. Swipe down on phone to see it.",
      });
    } else if (result.reason === "denied" || result.reason === "blocked") {
      setStatus({ type: "err", text: "Permission denied. Enable alerts in browser or OS settings." });
    } else if (result.reason === "unsupported") {
      setStatus({ type: "err", text: "This browser does not support notifications." });
    } else {
      setStatus({
        type: "err",
        text: "Could not show alert. Install the app (Add to Home Screen) or use Chrome/Edge.",
      });
    }
    setBusy(false);
  };

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100">Notifications</h3>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
          System tray alerts on this device plus in-app reminders (bell on Home).
        </p>
      </div>

      <label className="flex items-center justify-between gap-3 py-2">
        <span className="text-sm text-gray-700 dark:text-slate-300">Bill & due reminders</span>
        <input
          type="checkbox"
          checked={settings.remindersEnabled !== false}
          onChange={(e) => updateSettings({ remindersEnabled: e.target.checked })}
          className="w-5 h-5 rounded border-gray-300 text-indigo-600"
        />
      </label>

      {supported ? (
        <div className="rounded-xl bg-gray-50 dark:bg-slate-800/80 p-3 space-y-3">
          <p className="text-xs text-gray-600 dark:text-slate-300">
            Browser permission: <span className="font-semibold capitalize">{perm}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {perm !== "granted" && (
              <button
                type="button"
                disabled={busy}
                onClick={handleEnable}
                className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold disabled:opacity-60"
              >
                Enable browser alerts
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={handleTest}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-xs font-semibold text-gray-700 dark:text-slate-200 disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send test"}
            </button>
          </div>
          {status && (
            <p
              className={`text-xs rounded-lg px-3 py-2 ${
                status.type === "ok"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200"
                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100"
              }`}
            >
              {status.text}
            </p>
          )}
          <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">
            For YouTube-style alerts in your phone&apos;s notification panel: install the app (Add to
            Home Screen), allow notifications, and keep reminders on. Due/overdue bills notify in the
            tray when you leave the app or every few hours (Android/Chrome). iPhone needs the home-screen
            app icon — Safari tabs alone cannot background-notify.
          </p>
        </div>
      ) : (
        <p className="text-xs text-gray-500">Your browser does not support notifications.</p>
      )}
    </Card>
  );
}
