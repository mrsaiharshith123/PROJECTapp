import { useNavigate } from "react-router-dom";
import { Card, Button, Caption, Body, Heading } from "../../index.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useCloudSync } from "../../../hooks/useCloudSync.js";
import { isCloudSyncConfigured } from "../../../services/sync/syncEngine.js";
import { hasPaidBackupTier } from "../../../constants/subscriptionTiers.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";

/** Supabase account backup — Pro/Power only; optional enable toggle. */
export default function ProfileCloudSyncSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLoggedIn, user, profile } = useAuth();
  const { settings, updateSettings } = useCommitTrack();
  const sync = useCloudSync();
  const configured = isCloudSyncConfigured();
  const paid = hasPaidBackupTier(settings);
  const enabled = Boolean(settings.cloudSyncEnabled);

  const accountLabel =
    profile?.display_name?.trim() ||
    profile?.username?.trim() ||
    user?.email ||
    t("sync.yourAccount");

  if (!configured) {
    return (
      <Card className="ct-stack">
        <Heading level={3}>{t("sync.title")}</Heading>
        <Caption className="block">{t("sync.notConfigured")}</Caption>
      </Card>
    );
  }

  if (!paid) {
    return (
      <Card className="ct-stack">
        <Heading level={3}>{t("sync.title")}</Heading>
        <Body className="!text-sm">{t("sync.freePlanBody")}</Body>
        <Caption className="block">{t("sync.freePlanHint")}</Caption>
        <Button type="button" variant="primary" size="sm" onClick={() => navigate("/profile#upgrade")}>
          {t("common.viewPlans")} →
        </Button>
      </Card>
    );
  }

  if (!isLoggedIn) {
    return (
      <Card className="ct-stack">
        <Heading level={3}>{t("sync.title")}</Heading>
        <Body className="!text-sm">{t("sync.signInBody", { account: accountLabel })}</Body>
        <Caption className="block opacity-90">{t("sync.signInHint")}</Caption>
      </Card>
    );
  }

  return (
    <Card className="ct-stack">
      <div>
        <Heading level={3}>{t("sync.title")}</Heading>
        <Body className="!text-sm mt-1">{t("sync.accountLine", { account: accountLabel })}</Body>
      </div>

      <label className="ct-row-between gap-3 cursor-pointer">
        <span>
          <Body className="font-semibold !text-sm">{t("sync.toggleTitle")}</Body>
          <Caption className="block mt-0.5">{t("sync.toggleHint")}</Caption>
        </span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => updateSettings({ cloudSyncEnabled: e.target.checked })}
          className="h-5 w-5 accent-[var(--ct-accent)]"
        />
      </label>

      {enabled && (
        <>
          <div className="ct-hero-inset ct-stack gap-1 !text-xs">
            <p>• {t("sync.backupBullet")}</p>
            <p>• {t("sync.restoreBullet")}</p>
            <p>• {t("sync.autoBullet")}</p>
          </div>

          {sync.meta?.lastPushedAt && (
            <Caption className="block">
              {t("sync.lastBackup", {
                when: new Date(sync.meta.lastPushedAt).toLocaleString("en-IN"),
              })}
            </Caption>
          )}

          <div className="ct-grid-2 gap-2">
            <Button type="button" variant="primary" disabled={sync.busy} onClick={sync.pushNow}>
              {sync.busy ? t("sync.working") : t("sync.backupNow")}
            </Button>
            <Button type="button" variant="secondary" disabled={sync.busy} onClick={sync.forcePull}>
              {t("sync.restore")}
            </Button>
          </div>
        </>
      )}

      {!enabled && <Caption className="block">{t("sync.offHint")}</Caption>}

      {sync.message && <Caption className="block text-[var(--ct-success)]">{sync.message}</Caption>}
      {sync.error && <Caption className="block text-[var(--ct-danger)]">{sync.error}</Caption>}
    </Card>
  );
}
