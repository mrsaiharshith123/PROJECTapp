import { useEffect, useState } from "react";
import { Caption, Body, Button } from "../../index.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { loadSyncMeta, getDeviceLabel, getDeviceId } from "../../../services/sync/syncMeta.js";
import {
  listDeviceSessions,
  revokeDeviceSession,
  revokeAllOtherDeviceSessions,
  upsertDeviceSession,
} from "../../../services/deviceSessions.js";
import { signOutOtherSessions } from "../../../services/supabase/auth.js";
import { SettingsGroup, SettingsGroupContent } from "./SettingsGroup.jsx";

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
  const { settings } = usePerovo();
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
      <SettingsGroup title={t("security.title")} icon="shield" description={t("security.signInPrompt")}>
        <SettingsGroupContent>
          <Caption>{t("security.signInPrompt")}</Caption>
        </SettingsGroupContent>
      </SettingsGroup>
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
    <div className="ct-stack">
      <SettingsGroup title={t("security.title")} icon="shield" description={t("security.subtitle")}>
        <SettingsGroupContent className="ct-stack-sm text-sm">
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
        </SettingsGroupContent>
      </SettingsGroup>

      <SettingsGroup title={t("security.devicesTitle")} icon="device-mobile" description={t("security.devicesHint")}>
        <SettingsGroupContent className="ct-stack-sm">
          <div className="ct-row-between gap-2 flex-wrap">
            {sessions.length > 1 && (
              <Button type="button" variant="outline" size="sm" onClick={handleRevokeAll} className="!w-auto ml-auto">
                {t("security.signOutOthers")}
              </Button>
            )}
          </div>
          {loading && <Caption>{t("security.loadingDevices")}</Caption>}
          <div className="ct-stack-sm">
            {sessions.map((row) => {
              const isCurrent = row.device_id === currentId;
              const location = row.city || row.region || t("security.locationUnknown");
              return (
                <div key={row.device_id} className={`ct-hero-inset ct-stack-sm${isCurrent ? " ct-option-card-active" : ""}`}>
                  <div className="ct-row-between gap-2">
                    <div className="ct-row gap-2 min-w-0">
                      <span className="ct-icon-tile ct-icon-tile-sm teal shrink-0">
                        <CtIcon name="device-mobile" size={18} weight="duotone" />
                      </span>
                      <Body className="!text-sm font-semibold truncate">
                        {row.device_label || t("security.unknownDevice")}
                        {isCurrent ? ` (${t("security.thisDevice")})` : ""}
                      </Body>
                    </div>
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
              <div className="ct-hero-inset ct-stack-sm">
                <Body className="!text-sm">{getDeviceLabel()} ({t("security.thisDevice")})</Body>
                <Caption className="block">{t("security.devicesEmpty")}</Caption>
              </div>
            )}
          </div>
          {note && <Caption className="block text-[var(--ct-success)]">{note}</Caption>}
        </SettingsGroupContent>
      </SettingsGroup>
    </div>
  );
}
