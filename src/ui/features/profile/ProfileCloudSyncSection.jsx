import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Caption, Body, Heading, Modal } from "../../index.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useCloudSync } from "../../../hooks/useCloudSync.js";
import { fetchRemoteBackupMeta, isCloudSyncConfigured } from "../../../services/sync/syncEngine.js";
import { getDeviceLabel, loadBackupLog } from "../../../services/sync/syncMeta.js";
import { hasPaidBackupTier } from "../../../constants/subscriptionTiers.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";

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
            <Heading level={4} className="!text-sm mb-2">
              {t("sync.restoreHistory")}
            </Heading>
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
  const { settings, updateSettings } = useCommitTrack();
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
          onChange={(e) => {
            const on = e.target.checked;
            updateSettings({ cloudSyncEnabled: on });
            if (on) queueMicrotask(() => sync.pushNow());
          }}
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
            <Button type="button" variant="secondary" disabled={sync.busy} onClick={() => setRestoreOpen(true)}>
              {t("sync.restore")}
            </Button>
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
        </>
      )}

      {!enabled && <Caption className="block">{t("sync.offHint")}</Caption>}

      {sync.message && <Caption className="block text-[var(--ct-success)]">{sync.message}</Caption>}
      {sync.error && <Caption className="block text-[var(--ct-danger)]">{sync.error}</Caption>}
    </Card>
  );
}
