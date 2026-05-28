import Card from "../Card.jsx";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { encryptBackupPayload, uploadEncryptedBackup } from "../../services/drive/backup.js";

export default function ProfileSecuritySection({
  allCommitments,
  allLendings,
  allGoals,
  settings,
  monthlySnapshots,
  updateSettings,
}) {
  const { isLoggedIn, user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const makePassphrase = () => `${user?.id || ""}::${user?.email || ""}`;

  const backupToDrive = async () => {
    if (!isLoggedIn || !user) {
      setMessage("Login required before Google Drive backup.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const payload = {
        commitments: allCommitments,
        lendings: allLendings,
        settings,
        monthlySnapshots,
        goals: allGoals,
      };
      const encrypted = await encryptBackupPayload(payload, makePassphrase());
      await uploadEncryptedBackup(encrypted);
      setMessage("Google Drive backup saved.");
    } catch (e) {
      setMessage(e.message || "Could not backup to Google Drive.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100">Security & data</h3>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
          Everything stays on this device unless you export. No account password — protect your phone.
        </p>
      </div>

      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-600 p-3 text-xs text-gray-600 dark:text-slate-300 space-y-1">
        <p>• Data is stored in your browser local storage.</p>
        <p>• Export JSON regularly as backup.</p>
        <p>• Clearing site data will erase CommitTrack.</p>
      </div>

      <button
        type="button"
        className="w-full flex items-center justify-between py-3 px-1 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 text-left"
        onClick={() => {
          const payload = {
            commitments: allCommitments,
            lendings: allLendings,
            settings,
            monthlySnapshots,
            goals: allGoals,
          };
          const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "committrack-export.json";
          a.click();
          URL.revokeObjectURL(url);
        }}
      >
        <span className="text-sm font-medium text-gray-700 dark:text-slate-200">Export JSON backup</span>
        <span className="text-gray-400">›</span>
      </button>

      <button
        type="button"
        disabled={busy}
        className="w-full py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-sm font-medium text-indigo-700 dark:text-indigo-300 disabled:opacity-60"
        onClick={backupToDrive}
      >
        {busy ? "Backing up..." : "Backup to Google Drive"}
      </button>

      <button
        type="button"
        className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-sm font-medium text-gray-700 dark:text-slate-200"
        onClick={() => updateSettings({ readNotificationIds: [] })}
      >
        Mark all notifications as read
      </button>
      {message && <p className="text-xs text-gray-600 dark:text-slate-300">{message}</p>}
    </Card>
  );
}
