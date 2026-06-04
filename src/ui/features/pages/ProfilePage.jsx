import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  InstallAppBanner,
  PageHeaderWithNotifications,
  ProfileSectionPicker,
  StatCard,
  PlansButton,
  ToneSurface,
  Body,
  Caption,
} from "../../index.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { resolveUserMode, getIncomeLabel } from "../../../constants/modeExperience.js";
import { totalPaymentCountAndSum } from "../../../utils/profileStats.js";
import ProfileCompactHeader from "../ProfileCompactHeader.jsx";
import ProfileNotificationsSection from "../profile/ProfileNotificationsSection.jsx";
import ProfileBackupSection from "../profile/ProfileBackupSection.jsx";
import ProfileHistorySection from "../profile/ProfileHistorySection.jsx";
import ProfilePersonalSection from "../profile/ProfilePersonalSection.jsx";
import ProfileGuidanceSection from "../profile/ProfileGuidanceSection.jsx";
import { COPY } from "../../../constants/copy.js";

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    commitments,
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

  const [openSection, setOpenSection] = useState(() => {
    const fromNav = location.state?.openSection;
    if (fromNav === "money" || fromNav === "cloud" || fromNav === "security" || fromNav === "import") {
      return fromNav === "money" ? "personal" : "backup";
    }
    return fromNav ?? null;
  });

  useEffect(() => {
    if (location.state?.openSection) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.openSection, location.pathname, navigate]);

  const { count: paymentCount, sum: paymentSum } = totalPaymentCountAndSum(commitments);
  const incomeLabel = getIncomeLabel(settings);
  const incomeMissing = !settings.monthlyIncome || Number(settings.monthlyIncome) <= 0;
  const secondaryOnly =
    resolveUserMode(settings) === "salaried" &&
    incomeMissing &&
    Number(settings.secondaryMonthlyIncome) > 0;

  const renderPanel = useCallback(
    (id) => {
      switch (id) {
        case "guide":
          return (
            <ProfileGuidanceSection
              onStartGuide={() => {
                updateSettings({ appGuideComplete: false });
                navigate("/", { state: { replayGuide: true } });
              }}
            />
          );
        case "personal":
          return <ProfilePersonalSection settings={settings} updateSettings={updateSettings} />;
        case "backup":
          return (
            <ProfileBackupSection
              allCommitments={allCommitments}
              allLendings={allLendings}
              allGoals={allGoals}
              settings={settings}
              monthlySnapshots={monthlySnapshots}
            />
          );
        case "notifications":
          return <ProfileNotificationsSection settings={settings} updateSettings={updateSettings} />;
        case "history":
          return (
            <ProfileHistorySection
              commitments={commitments}
              getEffectiveStatus={getEffectiveStatus}
              todayStr={todayStr}
              deleteCommitment={deleteCommitment}
              removeCommitmentPayment={removeCommitmentPayment}
              updateCommitment={updateCommitment}
            />
          );
        default:
          return null;
      }
    },
    [
      allCommitments,
      allGoals,
      allLendings,
      commitments,
      deleteCommitment,
      getEffectiveStatus,
      monthlySnapshots,
      navigate,
      removeCommitmentPayment,
      settings,
      todayStr,
      updateCommitment,
      updateSettings,
    ],
  );

  return (
    <div className="ct-page pb-8">
      <PageHeaderWithNotifications greeting="Profile" headerActions={<PlansButton />} />

      <ProfileCompactHeader settings={settings} updateSettings={updateSettings} />

      <ProfileSectionPicker openId={openSection} onSelect={setOpenSection} renderPanel={renderPanel} />

      {!openSection && (
        <Caption className="text-center block px-2">
          Tap a section to expand it here. Tap again to collapse.
        </Caption>
      )}

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
            <button type="button" onClick={() => setOpenSection("personal")} className="ct-link">
              Open Personal & money
            </button>
          </Caption>
        </ToneSurface>
      )}

      <div className="ct-grid-2 ct-stats-compact">
        <StatCard value={commitments.length} label={COPY.billsStat} />
        <StatCard value={`\u20B9${paymentSum.toLocaleString("en-IN")}`} label={`Paid (${paymentCount})`} />
      </div>

      <InstallAppBanner />

      <Caption className="text-center block pb-2">Saved automatically on this device.</Caption>
    </div>
  );
};

export default Profile;
