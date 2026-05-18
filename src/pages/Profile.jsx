import Card from "../components/Card";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import { USER_MODES, getUserModeConfig } from "../constants/userModes.js";
import { getIncomeLabel, resolveUserMode } from "../constants/modeExperience.js";
import {
  computePaymentMonthStreak,
  computeControlScore,
  recentCommitmentPaymentEvents,
  totalPaymentCountAndSum,
} from "../utils/profileStats.js";
import InstallAppBanner from "../components/InstallAppBanner.jsx";
import PageHeaderWithNotifications from "../components/PageHeaderWithNotifications.jsx";
import ProfileAvatar from "../components/ProfileAvatar.jsx";
import ProfileManager from "../components/profile/ProfileManager.jsx";
import DataImportSection from "../components/profile/DataImportSection.jsx";
import ProfileNotificationsSection from "../components/profile/ProfileNotificationsSection.jsx";
import ProfileSecuritySection from "../components/profile/ProfileSecuritySection.jsx";
import { ProfileField, profileInputClass } from "../components/profile/ProfileField.jsx";
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
    updateSettings,
  } = useCommitTrack();

  const streak = computePaymentMonthStreak(commitments, lendings);
  const control = computeControlScore(commitments, getEffectiveStatus);
  const { count: paymentCount, sum: paymentSum } = totalPaymentCountAndSum(commitments);
  const recent = recentCommitmentPaymentEvents(commitments, 8);
  const incomeLabel = getIncomeLabel(resolveUserMode(settings));
  const modeCfg = getUserModeConfig(settings.userMode || "salaried");
  const incomeMissing = !settings.monthlyIncome || Number(settings.monthlyIncome) <= 0;

  return (
    <div className="space-y-5 max-w-lg mx-auto pb-8">
      <PageHeaderWithNotifications eyebrow="Account" title="Profile" />

      <Card className="flex flex-col items-center py-8 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-0 shadow-lg">
        <ProfileAvatar settings={settings} updateSettings={updateSettings} />
        <h2 className="text-xl font-bold mt-4" style={{ fontFamily: "'Sora', sans-serif" }}>
          {settings.displayName?.trim() || "CommitTrack user"}
        </h2>
        <p className="text-sm text-indigo-100 mt-1">{modeCfg.emoji} {modeCfg.label}</p>
      </Card>

      {incomeMissing && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Set your income</p>
          <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
            Required for affordability, chit timing, loan planner, and pressure scores.
          </p>
        </Card>
      )}

      <InstallAppBanner />

      <Card className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100">Personal</h3>
        <ProfileField label="Display name" hint="How we greet you on the dashboard.">
          <input
            className={profileInputClass}
            value={settings.displayName ?? ""}
            onChange={(e) => updateSettings({ displayName: e.target.value })}
            placeholder="Your name"
          />
        </ProfileField>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">Appearance</label>
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
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200"
                    : "border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100">Money setup</h3>
        <ProfileField label={`${incomeLabel} (₹)`} required hint="Used across analytics and tools.">
          <input
            type="number"
            min="0"
            className={profileInputClass}
            value={settings.monthlyIncome === 0 ? "" : String(settings.monthlyIncome)}
            onChange={(e) => {
              const raw = e.target.value;
              updateSettings({ monthlyIncome: raw === "" ? 0 : Math.max(0, Number(raw) || 0) });
            }}
            placeholder="e.g. 75000"
          />
        </ProfileField>
        <ProfileField label="Liquid savings (₹)" hint="Cash you can access quickly — emergency & survival math.">
          <input
            type="number"
            min="0"
            className={profileInputClass}
            value={settings.liquidSavings === 0 ? "" : String(settings.liquidSavings)}
            onChange={(e) => {
              const raw = e.target.value;
              updateSettings({ liquidSavings: raw === "" ? 0 : Math.max(0, Number(raw) || 0) });
            }}
          />
        </ProfileField>
        <ProfileField label="Dependents" hint="People relying on your income (family mode).">
          <input
            type="number"
            min="0"
            max="12"
            className={profileInputClass}
            value={settings.dependents === 0 ? "" : String(settings.dependents)}
            onChange={(e) => {
              const raw = e.target.value;
              updateSettings({
                dependents: raw === "" ? 0 : Math.min(12, Math.max(0, Math.floor(Number(raw) || 0))),
              });
            }}
          />
        </ProfileField>
        <ProfileField label="User mode" hint={modeCfg.description}>
          <select
            className={profileInputClass}
            value={settings.userMode || "salaried"}
            onChange={(e) => updateSettings({ userMode: e.target.value })}
          >
            {USER_MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.emoji} {m.label}
              </option>
            ))}
          </select>
        </ProfileField>
      </Card>

      <Card className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100">Profiles</h3>
        <p className="text-xs text-gray-500">Separate bills for home, business, or family.</p>
        <ProfileManager />
      </Card>

      <ProfileNotificationsSection settings={settings} updateSettings={updateSettings} />

      <ProfileSecuritySection
        allCommitments={allCommitments}
        allLendings={allLendings}
        allGoals={allGoals}
        settings={settings}
        monthlySnapshots={monthlySnapshots}
        updateSettings={updateSettings}
      />

      <Card className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100">Import & export</h3>
        <DataImportSection />
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center p-4">
          <p className="text-lg font-bold text-gray-800 dark:text-slate-100">{commitments.length}</p>
          <p className="text-xs text-gray-500">{COPY.billsStat}</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-lg font-bold text-gray-800 dark:text-slate-100">₹{paymentSum.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Paid ({paymentCount})</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-lg font-bold text-gray-800 dark:text-slate-100">{streak} mo</p>
          <p className="text-xs text-gray-500">Streak</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-lg font-bold text-indigo-600">{control}</p>
          <p className="text-xs text-gray-500">Control score</p>
        </Card>
      </div>

      {recent.length > 0 && (
        <Card className="space-y-2">
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">Recent payments</p>
          <ul className="divide-y divide-gray-100 dark:divide-slate-700">
            {recent.map((row) => (
              <li key={row.id} className="py-2 flex justify-between gap-2 text-sm">
                <span className="text-gray-700 dark:text-slate-300 truncate">{row.name}</span>
                <span className="text-gray-500 shrink-0">{formatDate(row.date)}</span>
                <span className="font-semibold shrink-0">₹{Number(row.amount).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="text-center text-[11px] text-gray-400 pb-2">Saved automatically on this device.</p>
    </div>
  );
};

export default Profile;
