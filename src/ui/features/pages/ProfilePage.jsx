import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import ProfileFinancialHero from "../profile/hub/ProfileFinancialHero.jsx";
import ProfileUpgradeRow from "../profile/hub/ProfileUpgradeRow.jsx";
import ProfileAdminEntry from "../profile/hub/ProfileAdminEntry.jsx";
import ProfileSettingsGroups from "../profile/hub/ProfileSettingsGroups.jsx";
import ProfileHubFooter from "../profile/hub/ProfileHubFooter.jsx";

/** @param {string | undefined} fromNav @returns {string | null} */
function resolveYouRoute(fromNav) {
  if (!fromNav) return null;
  const map = {
    personal: "/you/personal",
    "personal-identity": "/you/personal",
    "personal-account": "/you/account",
    "personal-money": "/you/money",
    money: "/you/money",
    "household-mode": "/you/household",
    "personal-appearance": "/you/appearance",
    "security-sessions": "/you/security",
    security: "/you/security",
    backup: "/you/backup",
    cloud: "/you/backup",
    import: "/you/backup",
    notifications: "/you/notifications",
    history: "/you/history",
    guide: "/you/support",
    support: "/you/about",
  };
  if (fromNav === "financial-life" || fromNav === "net-worth") return null;
  return map[fromNav] || null;
}

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, signOut, user } = useAuth();
  const { privacyMode, togglePrivacyMode } = useNetWorth();
  const { settings, updateSettings } = usePerovo();
  const { t } = useTranslation();
  const [signingOut, setSigningOut] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const route = resolveYouRoute(location.state?.openSection);
    if (!route) return;
    navigate(location.pathname, { replace: true, state: {} });
    navigate(route);
  }, [location.state?.openSection, location.pathname, navigate]);

  const incomeMissing = !settings.monthlyIncome || Number(settings.monthlyIncome) <= 0;

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }, [signOut]);

  const handleDeleteData = useCallback(() => {
    setDeleteError("");
    setDeleteInput("");
    setConfirmDelete(true);
  }, []);

  const confirmDeleteAll = useCallback(async () => {
    if (deleteInput !== "DELETE") return;
    setDeleting(true);
    setDeleteError("");
    try {
      const { clearAllLocalData } = await import("../../../utils/migrateStorage.js");
      const { deleteAccountData } = await import("../../../services/supabase/auth.js");
      clearAllLocalData();
      if (user?.id) await deleteAccountData(user.id);
      setConfirmDelete(false);
      window.location.reload();
    } catch {
      setDeleteError(t("backup.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  }, [user, t, deleteInput]);

  return (
    <div className="ct-page ct-profile-hub pb-8">
      <ProfileFinancialHero
        settings={settings}
        updateSettings={updateSettings}
        onOpenAccount={() => navigate("/you/personal")}
        onOpenSettings={() => {
          document.getElementById("profile-settings")?.scrollIntoView({ behavior: "smooth" });
        }}
        onOpenIncome={() => navigate("/you/money")}
        incomeMissing={incomeMissing}
      />

      <ProfileUpgradeRow settings={settings} />

      <ProfileAdminEntry />

      <ProfileSettingsGroups
        settings={settings}
        updateSettings={updateSettings}
        privacyMode={privacyMode}
        onTogglePrivacyMode={togglePrivacyMode}
      />

      <ProfileHubFooter
        isLoggedIn={isLoggedIn}
        signingOut={signingOut}
        onSignOut={handleSignOut}
        onDeleteData={handleDeleteData}
        deleting={deleting}
        deleteError={deleteError}
        confirmDeleteOpen={confirmDelete}
        onCloseDelete={() => !deleting && setConfirmDelete(false)}
        deleteConfirmValue={deleteInput}
        onDeleteConfirmChange={setDeleteInput}
        onConfirmDelete={confirmDeleteAll}
        userHasCloud={Boolean(user?.id)}
      />
    </div>
  );
};

export default Profile;
