import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useOnceFromState } from "../../../hooks/useOnceFromState.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import ProfileSettingsGroups from "../profile/hub/ProfileSettingsGroups.jsx";
import ProfileHubFooter from "../profile/hub/ProfileHubFooter.jsx";
import { PageShell } from "../../index.js";

/** @route /you — Settings hub (identity in profile glimpse menu). */

/** @param {string | undefined} fromNav @returns {string | null} */
function resolveYouRoute(fromNav) {
  if (!fromNav) return null;
  const map = {
    personal: "/you/personal",
    "personal-identity": "/you/personal",
    "personal-account": "/you/personal",
    "personal-money": "/you/personal",
    money: "/you/personal",
    account: "/you/personal",
    "household-mode": "/you",
    "personal-appearance": "/you/appearance",
    appearance: "/you/appearance",
    "security-sessions": "/you/security",
    security: "/you/security",
    backup: "/you/backup",
    cloud: "/you/backup",
    import: "/you/backup",
    notifications: "/you/notifications",
    history: "/you/history",
    guide: "/you/support",
    support: "/you/about",
    plans: "/you/plans",
    subscription: "/you/plans",
  };
  if (fromNav === "financial-life" || fromNav === "net-worth") return null;
  return map[fromNav] || null;
}

const Profile = () => {
  const navigate = useNavigate();
  const { isLoggedIn, signOut, user } = useAuth();
  const { privacyMode, togglePrivacyMode } = useNetWorth();
  const { settings, updateSettings } = usePerovo();
  const { t } = useTranslation();
  const [signingOut, setSigningOut] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useOnceFromState("openSection", (section) => {
    const route = resolveYouRoute(typeof section === "string" ? section : undefined);
    if (route) navigate(route);
  });

  useOnceFromState("openGoal", () => {
    navigate("/you/tools");
  });

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
    <PageShell title={t("nav.you")} className="ct-profile-hub">
      <div className="ct-stack-tight pb-8">
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
    </PageShell>
  );
};

export default Profile;
