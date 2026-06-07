import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { InstallAppBanner, ToneSurface, Body, Caption, Button } from "../../index.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.jsx";
import { resolveUserMode } from "../../../constants/modeExperience.js";
import { getIncomeLabelKey } from "../../../constants/modeExperience.js";
import { useProfileHubIntel } from "../../../hooks/useProfileHubIntel.js";
import ProfileNotificationsSection from "../profile/ProfileNotificationsSection.jsx";
import ProfileBackupSection from "../profile/ProfileBackupSection.jsx";
import ProfileHistorySection from "../profile/ProfileHistorySection.jsx";
import ProfilePersonalSection from "../profile/ProfilePersonalSection.jsx";
import ProfileGuidanceSection from "../profile/ProfileGuidanceSection.jsx";
import ProfileSupportSection from "../profile/ProfileSupportSection.jsx";
import ProfileBrandFooter from "../profile/ProfileBrandFooter.jsx";
import ProfileIdentityHero from "../profile/hub/ProfileIdentityHero.jsx";
import ProfileStatusWidgets from "../profile/hub/ProfileStatusWidgets.jsx";
import ProfileControlCenterGrid from "../profile/hub/ProfileControlCenterGrid.jsx";
import ProfileJourneyStrip from "../profile/hub/ProfileJourneyStrip.jsx";
import ProfileSettingsHub from "../profile/hub/ProfileSettingsHub.jsx";
import ProfileAdminEntry from "../profile/hub/ProfileAdminEntry.jsx";

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const hub = useProfileHubIntel();
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
  const { t } = useTranslation();

  const [openSection, setOpenSection] = useState(() => {
    const fromNav = location.state?.openSection;
    if (fromNav === "money" || fromNav === "cloud" || fromNav === "security" || fromNav === "import") {
      return fromNav === "money" ? "personal-money" : "backup";
    }
    if (fromNav === "personal") return "personal-identity";
    if (fromNav === "notifications") return "notifications";
    return fromNav ?? null;
  });

  useEffect(() => {
    if (location.state?.openSection) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.openSection, location.pathname, navigate]);

  const incomeLabel = t(getIncomeLabelKey(settings));
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
        case "personal-identity":
          return <ProfilePersonalSection settings={settings} updateSettings={updateSettings} part="identity" />;
        case "personal-money":
          return <ProfilePersonalSection settings={settings} updateSettings={updateSettings} part="money" />;
        case "personal-appearance":
          return <ProfilePersonalSection settings={settings} updateSettings={updateSettings} part="appearance" />;
        case "personal-account":
          return <ProfilePersonalSection settings={settings} updateSettings={updateSettings} part="account" />;
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
        case "support":
          return (
            <ProfileSupportSection
              onOpenGuide={() => {
                updateSettings({ appGuideComplete: false });
                navigate("/", { state: { replayGuide: true } });
              }}
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
    <div className="ct-page ct-profile-hub pb-8">
      <ProfileIdentityHero
        settings={settings}
        updateSettings={updateSettings}
        hub={hub}
        onOpenAccount={() => setOpenSection("personal-identity")}
      />

      {(secondaryOnly || incomeMissing) && (
        <div className="ct-reveal ct-reveal-delay-1">
          {secondaryOnly && (
            <ToneSurface tone="info">
              <Body className="font-semibold">{t("profile.mainIncomeZero")}</Body>
              <Caption className="block mt-1">
                {t("profile.mainIncomeZeroHint", { label: incomeLabel })}
              </Caption>
            </ToneSurface>
          )}
          {incomeMissing && (
            <ToneSurface tone="warning">
              <Body className="font-semibold">{t("profile.setIncome")}</Body>
              <Caption className="block mt-1">
                {t("profile.setIncomeHint")}{" "}
                <button type="button" onClick={() => setOpenSection("personal-money")} className="ct-link">
                  {t("profile.openPersonal")}
                </button>
              </Caption>
            </ToneSurface>
          )}
        </div>
      )}

      <ProfileStatusWidgets hub={hub} />
      <ProfileJourneyStrip hub={hub} />
      <ProfileControlCenterGrid openId={openSection} onSelect={setOpenSection} />
      <ProfileAdminEntry />
      <ProfileSettingsHub openId={openSection} onSelect={setOpenSection} renderPanel={renderPanel} />

      <InstallAppBanner />

      {isLoggedIn && (
        <Button
          type="button"
          variant="outline"
          className="w-full ct-reveal"
          disabled={signingOut}
          onClick={async () => {
            setSigningOut(true);
            try {
              await signOut();
            } finally {
              setSigningOut(false);
            }
          }}
        >
          {signingOut ? t("profile.signingOut") : t("profile.signOut")}
        </Button>
      )}

      <Caption className="text-center block pb-2">{t("profile.savedLocally")}</Caption>
      <ProfileBrandFooter />
    </div>
  );
};

export default Profile;
