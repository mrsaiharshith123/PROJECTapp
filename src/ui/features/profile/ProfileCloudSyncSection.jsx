import { useNavigate } from "react-router-dom";
import { Caption, Body } from "../../index.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useCloudSync } from "../../../hooks/useCloudSync.js";
import { isCloudSyncConfigured } from "../../../services/sync/syncEngine.js";
import { hasPaidBackupTier } from "../../../constants/subscriptionTiers.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { SettingsGroup, SettingsGroupContent, SettingsGroupToggleRow } from "./SettingsGroup.jsx";

/** Perovo cloud backup — account settings sync for all; finance data backup for Pro/Power. */
export default function ProfileCloudSyncSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLoggedIn, user, profile } = useAuth();
  const { settings, updateSettings } = usePerovo();
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
      <SettingsGroup title={t("sync.title")} icon="cloud" description={t("sync.notConfigured")}>
        <SettingsGroupContent>
          <Caption>{t("sync.notConfigured")}</Caption>
        </SettingsGroupContent>
      </SettingsGroup>
    );
  }

  if (!isLoggedIn) {
    return (
      <SettingsGroup title={t("sync.title")} icon="cloud" description={t("sync.signInHint")}>
        <SettingsGroupContent className="ct-stack-sm">
          <Body className="!text-sm">{t("sync.signInBody", { account: accountLabel })}</Body>
          <Caption className="block opacity-90">{t("sync.signInHint")}</Caption>
        </SettingsGroupContent>
      </SettingsGroup>
    );
  }

  return (
    <SettingsGroup title={t("sync.title")} icon="cloud" description={t("sync.accountLine", { account: accountLabel })}>
      <SettingsGroupContent className="ct-stack-sm">
        <div className="ct-stat-tile indigo ct-stack gap-1 !text-xs">
          <p>• {t("sync.accountSyncBullet")}</p>
          {paid ? (
            <>
              <p>• {t("sync.backupBullet")}</p>
              <p>• {t("sync.autoBullet")}</p>
              <p>• {t("sync.restoreOnLoginBullet")}</p>
            </>
          ) : (
            <p>• {t("sync.dataBackupPaidBullet")}</p>
          )}
        </div>
      </SettingsGroupContent>

      {paid ? (
        <SettingsGroupToggleRow
          icon="cloud"
          iconColor="teal"
          label={t("sync.toggleTitle")}
          hint={t("sync.toggleHint")}
          checked={enabled}
          onChange={(e) => {
            const on = e.target.checked;
            updateSettings({ cloudSyncEnabled: on });
            if (on) queueMicrotask(() => sync.pushNow());
          }}
        />
      ) : (
        <SettingsGroupContent>
          <Body className="!text-sm">{t("sync.freePlanBody")}</Body>
          <button type="button" className="ct-btn ct-btn-primary w-full mt-2" onClick={() => navigate("/profile#upgrade")}>
            {t("common.viewPlans")} →
          </button>
        </SettingsGroupContent>
      )}

      {paid && enabled ? (
        <SettingsGroupContent className="ct-stack-sm !pt-0">
          {sync.meta?.lastPushedAt && (
            <Caption className="block">
              {t("sync.lastBackup", {
                when: new Date(sync.meta.lastPushedAt).toLocaleString("en-IN"),
              })}
            </Caption>
          )}
        </SettingsGroupContent>
      ) : null}

      {!paid ? null : !enabled ? (
        <SettingsGroupContent>
          <Caption>{t("sync.offHint")}</Caption>
        </SettingsGroupContent>
      ) : null}

      {sync.message && (
        <SettingsGroupContent className="!pt-0">
          <Caption className="block text-[var(--ct-success)]">{sync.message}</Caption>
        </SettingsGroupContent>
      )}
      {sync.error && (
        <SettingsGroupContent className="!pt-0">
          <Caption className="block text-[var(--ct-danger)]">{sync.error}</Caption>
        </SettingsGroupContent>
      )}
    </SettingsGroup>
  );
}
