import Card from "../Card.jsx";

export default function ProfileSecuritySection({
  allCommitments,
  allLendings,
  allGoals,
  settings,
  monthlySnapshots,
  updateSettings,
}) {
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
        className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-sm font-medium text-gray-700 dark:text-slate-200"
        onClick={() => updateSettings({ readNotificationIds: [] })}
      >
        Mark all notifications as read
      </button>
    </Card>
  );
}
