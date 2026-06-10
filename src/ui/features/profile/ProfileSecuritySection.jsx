import { useEffect, useState } from "react";
import { Card, Caption, Body, Heading, Button } from "../../index.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { loadSyncMeta, getDeviceLabel, getDeviceId } from "../../../services/sync/syncMeta.js";
import {
  listDeviceSessions,
  revokeDeviceSession,
  revokeAllOtherDeviceSessions,
  upsertDeviceSession,
} from "../../../services/deviceSessions.js";
import { signOutOtherSessions } from "../../../services/supabase/auth.js";

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

/** Security & active sessions — Settings → Security (not Profile identity). */
export default function ProfileSecuritySection() {
  const { t } = useTranslation();
  const { user, profile, isLoggedIn } = useAuth();
  const { settings } = useCommitTrack();
  const meta = loadSyncMeta();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");

  const loadSessions = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await upsertDeviceSession(user.id, settings);
      const rows = await listDeviceSessions(user.id);
      setSessions(rows);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        await upsertDeviceSession(user.id, settings);
        const rows = await listDeviceSessions(user.id);
        if (alive) setSessions(rows);
      } catch {
        if (alive) setSessions([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isLoggedIn, user?.id, settings]);

  if (!isLoggedIn) {
    return (
      <Card className="ct-stack-sm">
        <Heading level={3}>{t("security.title")}</Heading>
        <Caption>{t("security.signInPrompt")}</Caption>
      </Card>
    );
  }

  const currentId = getDeviceId();
  const lastSignIn = user?.last_sign_in_at || user?.updated_at;

  const handleRevoke = async (deviceId) => {
    if (!user?.id || deviceId === currentId) return;
    setNote("");
    try {
      await revokeDeviceSession(user.id, deviceId);
      await signOutOtherSessions();
      setNote(t("security.deviceRevoked"));
      await loadSessions();
    } catch {
      setNote(t("security.deviceRevokeFailed"));
    }
  };

  const handleRevokeAll = async () => {
    if (!user?.id) return;
    setNote("");
    try {
      await revokeAllOtherDeviceSessions(user.id);
      await signOutOtherSessions();
      setNote(t("security.allOthersRevoked"));
      await loadSessions();
    } catch {
      setNote(t("security.deviceRevokeFailed"));
    }
  };

  return (
    <Card className="ct-stack-sm">
      <div>
        <Heading level={3}>{t("security.title")}</Heading>
        <Caption className="block mt-1">{t("security.subtitle")}</Caption>
      </div>

      <div className="ct-stack-sm text-sm">
        <div className="ct-row-between gap-2">
          <Caption>{t("security.email")}</Caption>
          <Body className="!text-sm truncate">{user?.email || "—"}</Body>
        </div>
        <div className="ct-row-between gap-2">
          <Caption>{t("security.lastSignIn")}</Caption>
          <Body className="!text-sm">{formatWhen(lastSignIn)}</Body>
        </div>
        <div className="ct-row-between gap-2">
          <Caption>{t("security.accountSince")}</Caption>
          <Body className="!text-sm">{formatWhen(user?.created_at)}</Body>
        </div>
        {profile?.username && (
          <div className="ct-row-between gap-2">
            <Caption>{t("account.username")}</Caption>
            <Body className="!text-sm">{profile.username}</Body>
          </div>
        )}
        {meta.lastPushedAt && (
          <div className="ct-row-between gap-2">
            <Caption>{t("security.lastBackup")}</Caption>
            <Body className="!text-sm">{formatWhen(meta.lastPushedAt)}</Body>
          </div>
        )}
        {meta.lastPulledAt && (
          <div className="ct-row-between gap-2">
            <Caption>{t("security.lastRestore")}</Caption>
            <Body className="!text-sm">{formatWhen(meta.lastPulledAt)}</Body>
          </div>
        )}
      </div>

      <div className="ct-stack-sm pt-2 border-t border-[var(--ct-border)]">
        <div className="ct-row-between gap-2 flex-wrap">
          <Heading level={4} className="!text-sm">
            {t("security.devicesTitle")}
          </Heading>
          {sessions.length > 1 && (
            <Button type="button" variant="outline" size="sm" onClick={handleRevokeAll}>
              {t("security.signOutOthers")}
            </Button>
          )}
        </div>
        <Caption className="block">{t("security.devicesHint")}</Caption>
        {loading && <Caption>{t("security.loadingDevices")}</Caption>}
        <div className="ct-stack-sm">
          {sessions.map((row) => {
            const isCurrent = row.device_id === currentId;
            const location = row.city || row.region || t("security.locationUnknown");
            return (
              <div key={row.device_id} className={`ct-inset ct-stack-sm${isCurrent ? " ct-option-card-active" : ""}`}>
                <div className="ct-row-between gap-2">
                  <Body className="!text-sm font-semibold">
                    {row.device_label || t("security.unknownDevice")}
                    {isCurrent ? ` (${t("security.thisDevice")})` : ""}
                  </Body>
                  {!isCurrent && (
                    <Button type="button" variant="outline" size="sm" onClick={() => handleRevoke(row.device_id)}>
                      {t("security.signOutDevice")}
                    </Button>
                  )}
                </div>
                <Caption className="block">
                  {t("security.deviceLocation", { location })}
                </Caption>
                <Caption className="block">
                  {t("security.deviceLastActive", { when: formatWhen(row.last_active_at) })}
                </Caption>
              </div>
            );
          })}
          {!loading && sessions.length === 0 && (
            <div className="ct-inset ct-stack-sm">
              <Body className="!text-sm">{getDeviceLabel()} ({t("security.thisDevice")})</Body>
              <Caption className="block">{t("security.devicesEmpty")}</Caption>
            </div>
          )}
        </div>
        {note && <Caption className="block text-[var(--ct-success)]">{note}</Caption>}
      </div>
    </Card>
  );
}
