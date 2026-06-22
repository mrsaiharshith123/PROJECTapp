import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Caption, Body, Modal } from "../../index.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useCloudSync } from "../../../hooks/useCloudSync.js";
import { fetchRemoteBackupMeta, isCloudSyncConfigured } from "../../../services/sync/syncEngine.js";
import { getDeviceLabel, loadBackupLog } from "../../../services/sync/syncMeta.js";
import { hasPaidBackupTier } from "../../../constants/subscriptionTiers.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { SettingsGroup, SettingsGroupContent, SettingsGroupToggleRow } from "./SettingsGroup.jsx";

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onRestoreLatest: () => Promise<void>,
 *   busy?: boolean,
 * }} props
 */
function RestoreBackupModal({ open, onClose, onRestoreLatest, busy = false }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [remoteMeta, setRemoteMeta] = useState(null);
  const log = loadBackupLog();

  useEffect(() => {
    if (!open || !user?.id) return;
    fetchRemoteBackupMeta(user.id)
      .then(setRemoteMeta)
      .catch(() => setRemoteMeta(null));
  }, [open, user?.id]);

  if (!open) return null;

  return (
    <Modal onClose={onClose} title={t("sync.restorePickerTitle")}>
      <div className="ct-stack-sm">
        <Caption className="block">{t("sync.restorePickerHint")}</Caption>

        {remoteMeta?.hasData ? (
          <div className="ct-hero-inset ct-stack-sm">
            <Body className="ct-body-strong !text-sm">{t("sync.restoreLatest")}</Body>
            <Caption className="block">
              {t("sync.restoreMeta", {
                when: formatWhen(remoteMeta.updatedAt),
                device: remoteMeta.deviceId || t("sync.unknownDevice"),
                bills: remoteMeta.counts.bills,
                lending: remoteMeta.counts.lending,
              })}
            </Caption>
            <Button type="button" variant="primary" size="sm" disabled={busy} onClick={onRestoreLatest}>
              {busy ? t("sync.working") : t("sync.restoreLatestBtn")}
            </Button>
          </div>
        ) : (
          <Caption className="block">{t("sync.noRemoteBackup")}</Caption>
        )}

        {log.length > 0 && (
          <div>
            <Body className="font-semibold !text-sm mb-2">{t("sync.restoreHistory")}</Body>
            <ul className="ct-stack-sm max-h-48 overflow-y-auto">
              {log.map((row, i) => (
                <li key={`${row.at}-${i}`} className="ct-hero-inset !text-xs">
                  <span className="font-semibold">
                    {row.type === "push" ? t("sync.logPush") : t("sync.logRestore")}
                  </span>
                  {" · "}
                  {formatWhen(row.at)}
                  <Caption className="block mt-0.5 opacity-80">
                    {row.deviceLabel || getDeviceLabel()}
                    {row.remoteDeviceId ? ` · ${t("sync.fromDevice", { id: row.remoteDeviceId.slice(0, 8) })}` : ""}
                    {row.counts
                      ? ` · ${t("sync.logCounts", { bills: row.counts.bills, lending: row.counts.lending })}`
                      : ""}
                  </Caption>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}

/** Supabase account backup — Pro/Power only; optional enable toggle. */
export default function ProfileCloudSyncSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLoggedIn, user, profile } = useAuth();
  const { settings, updateSettings } = usePerovo();
  const sync = useCloudSync();
  const configured = isCloudSyncConfigured();
  const paid = hasPaidBackupTier(settings);
  const enabled = Boolean(settings.cloudSyncEnabled);
  const [restoreOpen, setRestoreOpen] = useState(false);

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

  if (!paid) {
    return (
      <SettingsGroup title={t("sync.title")} icon="cloud" description={t("sync.freePlanHint")}>
        <SettingsGroupContent className="ct-stack-sm">
          <Body className="!text-sm">{t("sync.freePlanBody")}</Body>
          <button type="button" className="ct-btn ct-btn-primary w-full" onClick={() => navigate("/profile#upgrade")}>
            {t("common.viewPlans")} →
          </button>
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

      {enabled ? (
        <SettingsGroupContent className="ct-stack-sm">
          <div className="ct-stat-tile indigo ct-stack gap-1 !text-xs">
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
            <button type="button" className="ct-btn ct-btn-primary w-full" disabled={sync.busy} onClick={sync.pushNow}>
              {sync.busy ? t("sync.working") : t("sync.backupNow")}
            </button>
            <button type="button" className="ct-btn ct-btn-outline w-full" disabled={sync.busy} onClick={() => setRestoreOpen(true)}>
              {t("sync.restore")}
            </button>
          </div>
          <RestoreBackupModal
            open={restoreOpen}
            onClose={() => setRestoreOpen(false)}
            busy={sync.busy}
            onRestoreLatest={async () => {
              await sync.forcePull();
              setRestoreOpen(false);
            }}
          />
        </SettingsGroupContent>
      ) : (
        <SettingsGroupContent>
          <Caption>{t("sync.offHint")}</Caption>
        </SettingsGroupContent>
      )}

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
