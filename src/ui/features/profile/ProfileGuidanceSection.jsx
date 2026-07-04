import { useNavigate } from "react-router-dom";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { SettingsGroup, SettingsGroupRow, SettingsGroupContent } from "./SettingsGroup.jsx";

/** Settings: replay app guide or review setup wizard. */
export default function ProfileGuidanceSection({ onStartGuide }) {
  const navigate = useNavigate();
  const { settings } = usePerovo();
  const { t } = useTranslation();

  return (
    <SettingsGroup title={t("guide.appGuide.title")} icon="book-open" description={t("guide.appGuide.subtitle")}>
      <SettingsGroupRow
        icon="lightning"
        iconColor="violet"
        label={t("guide.startGuide")}
        hint={t("guide.appGuide.subtitle")}
        onClick={onStartGuide}
      />
      <SettingsGroupRow
        icon="clipboard-text"
        iconColor="teal"
        label={t("guide.reviewSetup")}
        hint={t("guide.setup.subtitle")}
        onClick={() => navigate("/onboarding?replay=1", { state: { fromProfile: true } })}
      />
      {settings.appGuideComplete ? (
        <SettingsGroupContent>
          <div className="ed-inset">
            <p style={{ fontSize: 13, color: "var(--ed-ink-soft)" }}>{t("guide.completedNote")}</p>
          </div>
        </SettingsGroupContent>
      ) : null}
    </SettingsGroup>
  );
}
