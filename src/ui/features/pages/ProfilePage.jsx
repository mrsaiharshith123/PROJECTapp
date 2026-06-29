import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useOnceFromState } from "../../../hooks/useOnceFromState.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { getTier } from "../../../utils/tierAccess.js";
import ProfileSettingsGroups from "../profile/hub/ProfileSettingsGroups.jsx";
import ProfileHubFooter from "../profile/hub/ProfileHubFooter.jsx";
import HomeEditorialAvatar from "../home/HomeEditorialAvatar.jsx";
import { Body, Button, Caption, Modal, inputClassName } from "../../index.js";

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

  const tier = getTier(settings);
  const displayName = settings.displayName || user?.email?.split("@")[0] || t("nav.you");
  const email = user?.email || "";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const avatarUrl = settings.profileImageUrl || null;
  const tierLabel =
    tier === "power"
      ? t("profile.ed.tierPowerBadge")
      : tier === "pro"
        ? t("profile.ed.tierProBadge")
        : t("profile.ed.tierFreePlan");

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
    if (deleteInput !== t("profileHub.deleteConfirmWord")) return;
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
    <div className="ct-page ed-paper">
      <div className="ed-masthead">
        <div className="ed-masthead-top">
          <div className="ed-masthead-brand">
            <h1 className="ed-title">{t("nav.you")}</h1>
            <div className="ed-tagline">{t("profile.ed.tagline")}</div>
          </div>
          <div className="ed-masthead-right">
            <HomeEditorialAvatar tier={tier} />
          </div>
        </div>
      </div>

      <div className="ed-you-hero">
        <div className="ed-you-avatar-ring">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            initials
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="ed-you-hero-name">{displayName}</div>
          {email ? <div className="ed-you-hero-email">{email}</div> : null}
          <div className="ed-you-hero-tier">{tierLabel}</div>
        </div>
        <button
          type="button"
          className="ed-ins-link"
          style={{ padding: 0, flexShrink: 0 }}
          onClick={() => navigate("/you/plans")}
        >
          {tier === "free" ? t("profile.ed.upgrade") : t("profile.ed.manage")}
        </button>
      </div>

      <ProfileSettingsGroups
        settings={settings}
        updateSettings={updateSettings}
        privacyMode={privacyMode}
        onTogglePrivacyMode={togglePrivacyMode}
      />

      {isLoggedIn ? (
        <div className="ed-ins-story" style={{ borderBottom: "1px solid var(--ed-rule)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <button
              type="button"
              className="ed-ins-row"
              onClick={handleSignOut}
              disabled={signingOut}
              style={{ color: "var(--ed-red)" }}
            >
              <span className="ed-ins-row-left">
                <span className="ed-ins-row-name" style={{ color: "var(--ed-red)" }}>
                  {signingOut ? t("profileHub.signingOut") : t("settings.row.signOut")}
                </span>
              </span>
            </button>
            <button
              type="button"
              className="ed-ins-row"
              onClick={handleDeleteData}
              style={{ color: "var(--ed-red)" }}
            >
              <span className="ed-ins-row-left">
                <span className="ed-ins-row-name" style={{ color: "var(--ed-red)", opacity: 0.7 }}>
                  {t("backup.deleteAll")}
                </span>
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="ed-ins-story" style={{ borderBottom: "1px solid var(--ed-rule)" }}>
          <button type="button" className="ed-ins-row" onClick={handleDeleteData} style={{ color: "var(--ed-red)" }}>
            <span className="ed-ins-row-left">
              <span className="ed-ins-row-name" style={{ color: "var(--ed-red)", opacity: 0.7 }}>
                {t("backup.deleteAll")}
              </span>
            </span>
          </button>
        </div>
      )}

      {confirmDelete ? (
        <Modal title={t("backup.deleteModalTitle")} onClose={() => !deleting && setConfirmDelete(false)}>
          <div className="ct-stack-sm">
            <Body className="!text-sm">
              {t("backup.deleteModalBody", {
                cloud: user?.id ? t("backup.deleteCloudModal") : t("backup.deleteSignout"),
              })}
            </Body>
            <Caption className="block">{t("profileHub.deleteTypePrompt")}</Caption>
            <input
              className={`${inputClassName()} ct-input-tint`}
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={t("profileHub.deleteConfirmWord")}
              autoComplete="off"
            />
            {deleteError ? <Caption className="block text-[var(--ct-danger)]">{deleteError}</Caption> : null}
            <div className="ct-row">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                variant="danger"
                className="flex-1"
                onClick={confirmDeleteAll}
                disabled={deleting || deleteInput !== t("profileHub.deleteConfirmWord")}
              >
                {deleting ? t("common.deleting") : t("backup.deleteConfirm")}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}

      <ProfileHubFooter showAuthActions={false} />
    </div>
  );
};

export default Profile;
