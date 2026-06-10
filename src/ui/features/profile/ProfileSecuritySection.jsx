import { Card, Caption, Body, Heading } from "../../index.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { loadSyncMeta, getDeviceLabel } from "../../../services/sync/syncMeta.js";

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

/** Account login & device security — under Settings → Account. */
export default function ProfileSecuritySection() {
  const { t } = useTranslation();
  const { user, profile, isLoggedIn } = useAuth();
  const meta = loadSyncMeta();

  if (!isLoggedIn) {
    return (
      <Card className="ct-stack-sm">
        <Heading level={3}>{t("security.title")}</Heading>
        <Caption>{t("security.signInPrompt")}</Caption>
      </Card>
    );
  }

  const lastSignIn = user?.last_sign_in_at || user?.updated_at;
  const accountCreated = user?.created_at;

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
          <Body className="!text-sm">{formatWhen(accountCreated)}</Body>
        </div>
        {profile?.username && (
          <div className="ct-row-between gap-2">
            <Caption>{t("account.username")}</Caption>
            <Body className="!text-sm">{profile.username}</Body>
          </div>
        )}
        <div className="ct-row-between gap-2">
          <Caption>{t("security.thisDevice")}</Caption>
          <Body className="!text-sm text-right">{getDeviceLabel()}</Body>
        </div>
        <div className="ct-row-between gap-2">
          <Caption>{t("security.deviceId")}</Caption>
          <Body className="!text-xs font-mono opacity-80 truncate max-w-[55%]">{meta.deviceId || "—"}</Body>
        </div>
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
    </Card>
  );
}
