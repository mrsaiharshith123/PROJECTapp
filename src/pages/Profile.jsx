import Card from "../components/Card";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import { USER_MODES, getUserModeConfig } from "../constants/userModes.js";
import {
  computePaymentMonthStreak,
  computeControlScore,
  recentCommitmentPaymentEvents,
  totalPaymentCountAndSum,
  outstandingLent,
} from "../utils/profileStats.js";
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  isNotificationSupported,
} from "../services/notifications/index.js";
import InstallAppBanner from "../components/InstallAppBanner.jsx";
import PageHeaderWithNotifications from "../components/PageHeaderWithNotifications.jsx";
import CollapsibleSection from "../components/CollapsibleSection.jsx";
import ProfileAvatar from "../components/ProfileAvatar.jsx";
import { COPY } from "../constants/copy.js";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const Profile = () => {
  const {
    commitments,
    lendings,
    allCommitments,
    allLendings,
    allGoals,
    settings,
    monthlySnapshots,
    getEffectiveStatus,
    getEffectiveLendingStatus,
    updateSettings,
  } = useCommitTrack();

  const streak = computePaymentMonthStreak(commitments, lendings);
  const control = computeControlScore(commitments, getEffectiveStatus);
  const { count: paymentCount, sum: paymentSum } = totalPaymentCountAndSum(commitments);
  const recent = recentCommitmentPaymentEvents(commitments, 10);
  const lentOut = outstandingLent(lendings);

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <PageHeaderWithNotifications eyebrow="Account" title="Profile" />

      <Card className="flex flex-col items-center py-8 bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-950 dark:to-slate-900 border-indigo-100 dark:border-indigo-800">
        <ProfileAvatar settings={settings} updateSettings={updateSettings} />
        <h2
          className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-4"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          {settings.displayName?.trim() || "CommitTrack user"}
        </h2>
        <p className="text-sm text-gray-400 dark:text-slate-400 mt-1">{COPY.trackBills}</p>
      </Card>

      <InstallAppBanner />

      <CollapsibleSection
        title="Account settings"
        subtitle="Appearance, income, user mode, and profile"
        defaultOpen={false}
      >
        <div className="space-y-4 pt-3">
          <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Appearance</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "light", label: "Light" },
              { id: "dark", label: "Dark" },
              { id: "system", label: "System" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateSettings({ colorScheme: opt.id })}
                className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  (settings.colorScheme || "system") === opt.id
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-400"
                    : "border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-indigo-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">System follows your device light/dark setting.</p>
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Display name</label>
          <input
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm"
            value={settings.displayName ?? ""}
            onChange={(e) => updateSettings({ displayName: e.target.value })}
            placeholder="How we greet you"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Monthly income (₹)</label>
          <input
            type="number"
            min="0"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm"
            value={settings.monthlyIncome === 0 ? "" : String(settings.monthlyIncome)}
            onChange={(e) => {
              const raw = e.target.value;
              updateSettings({
                monthlyIncome: raw === "" ? 0 : Math.max(0, Number(raw) || 0),
              });
            }}
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">User mode</label>
          <select
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm"
            value={settings.userMode || "salaried"}
            onChange={(e) => updateSettings({ userMode: e.target.value })}
          >
            {USER_MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.emoji} {m.label}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-gray-400 mt-1">{getUserModeConfig(settings.userMode).description}</p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Active profile (for new items)</label>
          <select
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm"
            value={settings.activeProfileId || "default"}
            onChange={(e) => updateSettings({ activeProfileId: e.target.value })}
          >
            <option value="default">Personal (default)</option>
            <option value="family">Family</option>
            <option value="business">Business</option>
          </select>
          <p className="text-[11px] text-gray-400 mt-1">{COPY.newBillsHint}</p>
        </div>
        <p className="text-[11px] text-gray-400">Saved automatically on this device.</p>
        </div>
      </CollapsibleSection>

      <Card className="border-dashed border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 space-y-2">
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">CommitTrack Plus (coming soon)</p>
        <p className="text-xs text-amber-800 dark:text-amber-300/90">
          Cloud backup, SMS reminders, and shared family profiles — placeholder for future premium tier. All core
          features stay free on this device.
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center p-4">
          <span className="text-2xl">📋</span>
          <p className="text-lg font-bold text-gray-800 mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
            {commitments.length}
          </p>
          <p className="text-xs text-gray-400">{COPY.billsStat}</p>
        </Card>
        <Card className="text-center p-4">
          <span className="text-2xl">✅</span>
          <p className="text-lg font-bold text-gray-800 mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
            ₹{paymentSum.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">Total paid ({paymentCount})</p>
        </Card>
        <Card className="text-center p-4">
          <span className="text-2xl">🤝</span>
          <p className="text-lg font-bold text-gray-800 mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
            ₹{lentOut.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">Lent (outstanding)</p>
        </Card>
        <Card className="text-center p-4">
          <span className="text-2xl">🔥</span>
          <p className="text-lg font-bold text-gray-800 mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
            {streak} mo
          </p>
          <p className="text-xs text-gray-400">Payment streak</p>
        </Card>
      </div>

      <Card className="space-y-2">
        <p className="text-sm font-semibold text-gray-700">Monthly control score</p>
        <p className="text-xs text-gray-500">
          Starts at 100 and subtracts for overdue items and open critical bills. Transparent, local-only
          signal—not advice.
        </p>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${control}%` }}
            />
          </div>
          <span className="text-lg font-bold text-indigo-600" style={{ fontFamily: "'Sora', sans-serif" }}>
            {control}
          </span>
        </div>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-semibold text-gray-700">Recent payment activity</p>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-400">No payments recorded yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recent.map((row) => (
              <li key={row.id} className="py-2 flex justify-between gap-2 text-sm">
                <span className="text-gray-700 truncate">{row.name}</span>
                <span className="text-gray-500 shrink-0">{formatDate(row.date)}</span>
                <span className="font-semibold text-gray-900 shrink-0">₹{Number(row.amount).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-1">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Data</p>
        <button
          type="button"
          className="w-full flex items-center justify-between py-3 px-1 rounded-xl hover:bg-gray-50 text-left"
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
          <span className="text-sm font-medium text-gray-700">Export JSON</span>
          <span className="text-gray-300">›</span>
        </button>
        <button
          type="button"
          className="w-full flex items-center justify-between py-3 px-1 rounded-xl hover:bg-gray-50 text-left"
          onClick={() => {
            const rows = [["type", "name", "amount", "dueDate", "status"]];
            for (const c of commitments) {
              rows.push([
                "commitment",
                c.name,
                String(c.remainingAmount ?? c.amount),
                c.dueDate,
                getEffectiveStatus(c),
              ]);
            }
            for (const l of lendings) {
              rows.push([
                "lending",
                l.personName,
                String(l.remainingAmount),
                l.dueDate,
                getEffectiveLendingStatus(l),
              ]);
            }
            const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "committrack-export.csv";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <span className="text-sm font-medium text-gray-700">Export CSV</span>
          <span className="text-gray-300">›</span>
        </button>
        <p className="text-[11px] text-gray-400 px-1 pb-2">
          JSON/CSV exports include all profiles. Dashboard views filter by active profile only.
        </p>
        {isNotificationSupported() && (
          <button
            type="button"
            className="w-full flex items-center justify-between py-3 px-1 rounded-xl hover:bg-gray-50 text-left"
            onClick={async () => {
              const perm = await requestNotificationPermission();
              if (perm === "granted") await sendTestNotification();
            }}
          >
            <span className="text-sm font-medium text-gray-700">
              Browser reminders ({getNotificationPermission()})
            </span>
            <span className="text-gray-300">›</span>
          </button>
        )}
      </Card>
    </div>
  );
};

export default Profile;
