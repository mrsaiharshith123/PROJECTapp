import { useNavigate } from "react-router-dom";
import { Caption } from "../../index.js";
import { PerovoBrand } from "../../brand/PerovoBrand.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { SettingsGroup, SettingsGroupRow, SettingsGroupContent } from "./SettingsGroup.jsx";

const APP_VERSION = import.meta.env.VITE_APP_VERSION || "0.0.0";

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
          <Caption className="block">{t("support.aboutBody")}</Caption>
          <Caption className="block opacity-80">{t("support.version", { version: APP_VERSION })}</Caption>
          <div className="flex justify-center pt-1">
            <PerovoBrand layout="column" iconSize="sm" wordmarkSize="sm" />
          </div>
        </SettingsGroupContent>
      </SettingsGroup>
    </div>
  );
}
