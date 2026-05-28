import { useState } from "react";
import Card from "../components/Card";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import { getUserModeConfig } from "../constants/userModes.js";
import { resolveUserMode, getIncomeLabel, hasPowerFeatures, isSalariedFamily } from "../constants/modeExperience.js";
import {
  computePaymentMonthStreak,
  computeControlScore,
  totalPaymentCountAndSum,
} from "../utils/profileStats.js";
import InstallAppBanner from "../components/InstallAppBanner.jsx";
import PageHeaderWithNotifications from "../components/PageHeaderWithNotifications.jsx";
import ProfileAvatar from "../components/ProfileAvatar.jsx";
import AccountPanel from "../components/auth/AccountPanel.jsx";
import DataImportSection from "../components/profile/DataImportSection.jsx";
import ProfileNotificationsSection from "../components/profile/ProfileNotificationsSection.jsx";
import ProfileSecuritySection from "../components/profile/ProfileSecuritySection.jsx";
import ProfileHistorySection from "../components/profile/ProfileHistorySection.jsx";
import { ProfileSectionPicker } from "../components/profile/ProfileSectionPicker.jsx";
import ProfilePersonalSection from "../components/profile/ProfilePersonalSection.jsx";
import ProfileMoneySection from "../components/profile/ProfileMoneySection.jsx";
import { COPY } from "../constants/copy.js";
import { isEnhancedUi } from "../constants/uiTheme.js";

const Profile = () => {
  const enhanced = isEnhancedUi();
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
    updateCommitment,
    deleteCommitment,
    removeCommitmentPayment,
    todayStr,
  } = useCommitTrack();

  const [openSection, setOpenSection] = useState(null);

  const streak = computePaymentMonthStreak(commitments, lendings);
  const control = computeControlScore(commitments, getEffectiveStatus);
  const { count: paymentCount, sum: paymentSum } = totalPaymentCountAndSum(commitments);
  const incomeLabel = getIncomeLabel(settings);
  const modeCfg = getUserModeConfig(resolveUserMode(settings));
  const salariedFamily = isSalariedFamily(settings);
  const incomeMissing = !settings.monthlyIncome || Number(settings.monthlyIncome) <= 0;
  const secondaryOnly =
    resolveUserMode(settings) === "salaried" &&
    incomeMissing &&
    Number(settings.secondaryMonthlyIncome) > 0;

  return (
    <div className="space-y-5 max-w-lg mx-auto pb-8">
      <PageHeaderWithNotifications eyebrow="Account" title="Profile" />

      <Card className="flex flex-col items-center py-8 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-0 shadow-lg">
        <ProfileAvatar settings={settings} updateSettings={updateSettings} />
        <h2 className="text-xl font-bold mt-4" style={{ fontFamily: "'Sora', sans-serif" }}>
          {settings.displayName?.trim() || "CommitTrack user"}
        </h2>
        <p className="text-sm text-indigo-100 mt-1">
          {modeCfg.emoji} {modeCfg.label}
          {salariedFamily ? " · Family household" : ""}
          {hasPowerFeatures(settings) ? " · Pro" : ""}
        </p>
      </Card>

      <AccountPanel />

      {secondaryOnly && (
        <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40">
          <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">Main income is zero</p>
          <p className="text-xs text-indigo-800 dark:text-indigo-200 mt-1">
            You entered second income only. Put the larger or primary salary in &quot;{incomeLabel}&quot; and partner
            / side income in second income so job-loss scenarios and labels stay intuitive.
          </p>
        </Card>
      )}

      {incomeMissing && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Set your income</p>
          <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
            Required for affordability, chit timing, loan planner, and pressure scores.{" "}
            <button
              type="button"
              onClick={() => setOpenSection("money")}
              className="font-semibold underline"
            >
              Open Money setup
            </button>
          </p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card className={`text-center p-4 ${enhanced ? "ui-stat-tile" : ""}`}>
          <p className="text-lg font-bold text-gray-800 dark:text-slate-100">{commitments.length}</p>
          <p className="text-xs text-gray-500">{COPY.billsStat}</p>
        </Card>
        <Card className={`text-center p-4 ${enhanced ? "ui-stat-tile" : ""}`}>
          <p className="text-lg font-bold text-gray-800 dark:text-slate-100">₹{paymentSum.toLocaleString("en-IN")}</p>
          <p className="text-xs text-gray-500">Paid ({paymentCount})</p>
        </Card>
        <Card className={`text-center p-4 ${enhanced ? "ui-stat-tile" : ""}`}>
          <p className="text-lg font-bold text-gray-800 dark:text-slate-100">{streak} mo</p>
          <p className="text-xs text-gray-500">Streak</p>
        </Card>
        <Card className={`text-center p-4 ${enhanced ? "ui-stat-tile" : ""}`}>
          <p className="text-lg font-bold text-indigo-600">{control}</p>
          <p className="text-xs text-gray-500">Control score</p>
        </Card>
      </div>

      <InstallAppBanner />

      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide px-0.5">
          Settings
        </p>
        <ProfileSectionPicker openId={openSection} onSelect={setOpenSection} />
      </div>

      {openSection === "personal" && (
        <ProfilePersonalSection settings={settings} updateSettings={updateSettings} />
      )}

      {openSection === "money" && (
        <ProfileMoneySection settings={settings} updateSettings={updateSettings} />
      )}

      {openSection === "notifications" && (
        <ProfileNotificationsSection settings={settings} updateSettings={updateSettings} />
      )}

      {openSection === "security" && (
        <ProfileSecuritySection
          allCommitments={allCommitments}
          allLendings={allLendings}
          allGoals={allGoals}
          settings={settings}
          monthlySnapshots={monthlySnapshots}
          updateSettings={updateSettings}
        />
      )}

      {openSection === "import" && (
        <Card className="space-y-3">
          <DataImportSection />
        </Card>
      )}

      {openSection === "history" && (
        <ProfileHistorySection
          commitments={commitments}
          getEffectiveStatus={getEffectiveStatus}
          todayStr={todayStr}
          deleteCommitment={deleteCommitment}
          removeCommitmentPayment={removeCommitmentPayment}
          updateCommitment={updateCommitment}
        />
      )}

      {!openSection && (
        <p className="text-center text-xs text-gray-400 dark:text-slate-500 px-2">
          Tap a section above to view or edit. Tap again to collapse.
        </p>
      )}

      <p className="text-center text-[11px] text-gray-400 pb-2">Saved automatically on this device.</p>
    </div>
  );
};

export default Profile;
