import { useState } from "react";
import {
  Card,
  InstallAppBanner,
  PageHeaderWithNotifications,
  ProfileSectionPicker,
  StatCard,
  ProfileHeroCard,
  ToneSurface,
  Heading,
  Body,
  Caption,
} from "../../index.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { getUserModeConfig } from "../../../constants/userModes.js";
import { resolveUserMode, getIncomeLabel, hasPowerFeatures, isSalariedFamily } from "../../../constants/modeExperience.js";
import {
  computePaymentMonthStreak,
  computeControlScore,
  totalPaymentCountAndSum,
} from "../../../utils/profileStats.js";
import ProfileAvatar from "../profile/ProfileAvatar.jsx";
import AccountPanel from "../auth/AccountPanel.jsx";
import DataImportSection from "../profile/DataImportSection.jsx";
import ProfileNotificationsSection from "../profile/ProfileNotificationsSection.jsx";
import ProfileSecuritySection from "../profile/ProfileSecuritySection.jsx";
import ProfileHistorySection from "../profile/ProfileHistorySection.jsx";
import ProfilePersonalSection from "../profile/ProfilePersonalSection.jsx";
import ProfileMoneySection from "../profile/ProfileMoneySection.jsx";
import { COPY } from "../../../constants/copy.js";

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
    <div className="ct-page pb-8">
      <PageHeaderWithNotifications greeting="Profile" />

      <ProfileHeroCard>
        <ProfileAvatar settings={settings} updateSettings={updateSettings} />
        <Heading level={2} className="mt-4">
          {settings.displayName?.trim() || "CommitTrack user"}
        </Heading>
        <Caption className="mt-1 block">
          {modeCfg.emoji} {modeCfg.label}
          {salariedFamily ? " ? Family household" : ""}
          {hasPowerFeatures(settings) ? " ? Pro" : ""}
        </Caption>
        <Caption className="mt-2 block opacity-80">Manage your financial world</Caption>
      </ProfileHeroCard>

      <AccountPanel />

      {secondaryOnly && (
        <ToneSurface tone="info">
          <Body className="font-semibold">Main income is zero</Body>
          <Caption className="block mt-1">
            You entered second income only. Put the larger or primary salary in &quot;{incomeLabel}&quot; and partner
            / side income in second income so job-loss scenarios and labels stay intuitive.
          </Caption>
        </ToneSurface>
      )}

      {incomeMissing && (
        <ToneSurface tone="warning">
          <Body className="font-semibold">Set your income</Body>
          <Caption className="block mt-1">
            Required for affordability, chit timing, loan planner, and pressure scores.{" "}
            <button type="button" onClick={() => setOpenSection("money")} className="ct-link">
              Open Money setup
            </button>
          </Caption>
        </ToneSurface>
      )}

      <div className="ct-grid-2">
        <StatCard value={commitments.length} label={COPY.billsStat} />
        <StatCard value={`\u20B9${paymentSum.toLocaleString("en-IN")}`} label={`Paid (${paymentCount})`} />
        <StatCard value={`${streak} mo`} label="Streak" />
        <StatCard value={control} label="Control score" valueClassName="ct-metric-value-accent" />
      </div>

      <InstallAppBanner />

      <div className="ct-stack-sm">
        <Caption className="font-semibold uppercase tracking-wide px-0.5">Settings</Caption>
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
        <Card>
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
        <Caption className="text-center block px-2">
          Tap a section above to view or edit. Tap again to collapse.
        </Caption>
      )}

      <Caption className="text-center block pb-2">Saved automatically on this device.</Caption>
    </div>
  );
};

export default Profile;
