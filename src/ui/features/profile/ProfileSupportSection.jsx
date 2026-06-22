import { useNavigate } from "react-router-dom";
import { Caption } from "../../index.js";
import { PerovoBrand } from "../../brand/PerovoBrand.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { SettingsGroup, SettingsGroupRow, SettingsGroupContent } from "./SettingsGroup.jsx";
import { getLocalAppVersion } from "../../../services/appUpdate.js";

export default function ProfileSupportSection({ onOpenGuide }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="ct-stack">
      <SettingsGroup title={t("support.title")} icon="chat-circle" description={t("support.subtitle")}>
        <SettingsGroupRow
          icon="book-open"
          iconColor="violet"
          label={t("support.helpCenter")}
          hint={t("support.helpCenterHint")}
          onClick={onOpenGuide}
        />
        <SettingsGroupRow
          icon="shield"
          iconColor="teal"
          label={t("support.privacy")}
          hint={t("support.privacyHint")}
          onClick={() => navigate("/privacy")}
        />
        <SettingsGroupRow
          icon="chat-circle"
          iconColor="amber"
          label={t("support.contact")}
          hint={t("support.contactHint")}
          value={t("support.contactEmail")}
          onClick={() => {
            window.location.href = `mailto:${t("support.contactEmail")}`;
          }}
        />
      </SettingsGroup>

      <SettingsGroup title={t("support.about")} icon="book">
        <SettingsGroupContent className="ct-stack-sm">
          <div className="ct-stat-tile">
            <p className="ct-stat-tile-value text-sm">{t("support.aboutBody")}</p>
            <p className="ct-stat-tile-label mt-1">{t("support.version", { version: getLocalAppVersion() })}</p>
          </div>
          <div className="flex justify-center pt-1">
            <PerovoBrand layout="column" iconSize="sm" wordmarkSize="sm" />
          </div>
        </SettingsGroupContent>
      </SettingsGroup>
    </div>
  );
}
