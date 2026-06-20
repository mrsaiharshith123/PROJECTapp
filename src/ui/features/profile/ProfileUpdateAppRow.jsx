import { useTranslation } from "../../../i18n/I18nProvider.js";
import { SettingsGroupRow, SettingsGroupContent } from "./SettingsGroup.jsx";
import { Caption } from "../../index.js";
import { useAppUpdateAction } from "../../../hooks/useAppUpdateAction.js";

/** One-tap in-app update — checks live server, pulls build, restarts (no browser redirect). */
export default function ProfileUpdateAppRow() {
  const { t } = useTranslation();
  const { status, busy, runUpdate } = useAppUpdateAction();

  return (
    <>
      <SettingsGroupRow
        icon="arrows-clockwise"
        iconColor="violet"
        label={t("settings.row.updateApp")}
        hint={t("support.updateAppHint")}
        onClick={runUpdate}
        disabled={busy}
      />
      {status ? (
        <SettingsGroupContent>
          <Caption className="block">{status}</Caption>
        </SettingsGroupContent>
      ) : null}
    </>
  );
}
