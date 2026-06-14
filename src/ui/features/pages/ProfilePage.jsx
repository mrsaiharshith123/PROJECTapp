import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { InstallAppBanner, ToneSurface, Body, Caption, Button, Modal } from "../../index.js";
import { resolveUserMode, getIncomeLabelKey } from "../../../constants/modeExperience.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import ProfileNotificationsSection from "../profile/ProfileNotificationsSection.jsx";
import ProfileBackupSection from "../profile/ProfileBackupSection.jsx";
import ProfileHistorySection from "../profile/ProfileHistorySection.jsx";
import ProfilePersonalSection from "../profile/ProfilePersonalSection.jsx";
import ProfileGuidanceSection from "../profile/ProfileGuidanceSection.jsx";
import ProfileSupportSection from "../profile/ProfileSupportSection.jsx";
import ProfileBrandFooter from "../profile/ProfileBrandFooter.jsx";
import ProfileFinancialHero from "../profile/hub/ProfileFinancialHero.jsx";
import ProfileSettingsSheet from "../profile/hub/ProfileSettingsSheet.jsx";
import ProfileAdminEntry from "../profile/hub/ProfileAdminEntry.jsx";
import ProfileNetWorthSection from "../profile/ProfileNetWorthSection.jsx";
import ProfileSecuritySection from "../profile/ProfileSecuritySection.jsx";

/** @param {string | undefined} fromNav @returns {string | null} */
function resolveSettingsSection(fromNav) {
  if (!fromNav) return null;
  if (fromNav === "financial-life" || fromNav === "net-worth") return null;
  if (fromNav === "money" || fromNav === "personal-money") return "personal-money";
  if (fromNav === "cloud" || fromNav === "import") return "backup";
  if (fromNav === "security") return "security-sessions"; // opens Privacy & security group
  if (fromNav === "personal") return "personal-identity";
  if (fromNav === "notifications") return "notifications";
  return fromNav;
}

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, signOut, user } = useAuth();
  const { privacyMode, togglePrivacyMode } = useNetWorth();
  const [signingOut, setSigningOut] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
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

  const initialSettingsSection = resolveSettingsSection(location.state?.openSection);
  const [settingsOpen, setSettingsOpen] = useState(Boolean(initialSettingsSection));
  const [openSection, setOpenSection] = useState(initialSettingsSection);

  useEffect(() => {
    if (!location.state?.openSection) return;
    const section = resolveSettingsSection(location.state.openSection);
    navigate(location.pathname, { replace: true, state: {} });
    if (!section) return;
    queueMicrotask(() => {
      setOpenSection(section);
      setSettingsOpen(true);
    });
  }, [location.state?.openSection, location.pathname, navigate]);

  const incomeLabel = t(getIncomeLabelKey(settings));
  const incomeMissing = !settings.monthlyIncome || Number(settings.monthlyIncome) <= 0;
  const secondaryOnly =
    resolveUserMode(settings) === "salaried" &&
    incomeMissing &&
    Number(settings.secondaryMonthlyIncome) > 0;

  const openSettings = useCallback((section = null) => {
    setOpenSection(section);
    setSettingsOpen(true);
  }, []);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await signOut();
      setSettingsOpen(false);
    } finally {
      setSigningOut(false);
    }
  }, [signOut]);

  const handleDeleteData = useCallback(() => {
    setDeleteError("");
    setConfirmDelete(true);
  }, []);

  const confirmDeleteAll = useCallback(async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      const { clearAllLocalData } = await import("../../../utils/migrateStorage.js");
      const { deleteAccountData } = await import("../../../services/supabase/auth.js");
      clearAllLocalData();
      if (user?.id) await deleteAccountData(user.id);
      setConfirmDelete(false);
      setSettingsOpen(false);
      window.location.reload();
    } catch {
      setDeleteError(t("backup.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  }, [user, t]);

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
          return (
            <ProfilePersonalSection
              settings={settings}
              updateSettings={updateSettings}
              part="money"
            />
          );
        case "personal-appearance":
          return <ProfilePersonalSection settings={settings} updateSettings={updateSettings} part="appearance" />;
        case "personal-account":
          return <ProfilePersonalSection settings={settings} updateSettings={updateSettings} part="account" />;
        case "security-sessions":
          return <ProfileSecuritySection />;
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
      <ProfileFinancialHero
        settings={settings}
        updateSettings={updateSettings}
        onOpenAccount={() => openSettings("personal-identity")}
        onOpenSettings={() => openSettings(null)}
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
                <button type="button" onClick={() => openSettings("personal-money")} className="ct-link">
                  {t("profile.openPersonal")}
                </button>
              </Caption>
            </ToneSurface>
          )}
        </div>
      )}

      <ProfileNetWorthSection />

      <ProfileAdminEntry />

      <ProfileSettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        openId={openSection}
        onSelect={setOpenSection}
        renderPanel={renderPanel}
        settings={settings}
        isLoggedIn={isLoggedIn}
        privacyMode={privacyMode}
        onTogglePrivacyMode={togglePrivacyMode}
        onSignOut={handleSignOut}
        onDeleteData={handleDeleteData}
        signingOut={signingOut}
      />

      {confirmDelete ? (
        <Modal title={t("backup.deleteModalTitle")} onClose={() => !deleting && setConfirmDelete(false)}>
          <div className="ct-stack-sm">
            <Body className="!text-sm">
              {t("backup.deleteModalBody", {
                cloud: user?.id ? t("backup.deleteCloudModal") : t("backup.deleteSignout"),
              })}
            </Body>
            {deleteError ? <Caption className="block text-[var(--ct-danger)]">{deleteError}</Caption> : null}
            <div className="ct-row">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                {t("common.cancel")}
              </Button>
              <Button type="button" variant="danger" className="flex-1" onClick={confirmDeleteAll} disabled={deleting}>
                {deleting ? t("common.deleting") : t("backup.deleteConfirm")}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}

      <InstallAppBanner />

      <Caption className="text-center block pb-2">{t("profile.savedLocally")}</Caption>
      <ProfileBrandFooter />
    </div>
  );
};

export default Profile;
