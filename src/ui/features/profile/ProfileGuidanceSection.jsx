import { useNavigate } from "react-router-dom";
import { Card, Button, Body, Caption } from "../../index.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";

/** Settings: replay app guide or review setup wizard. */
export default function ProfileGuidanceSection({ onStartGuide }) {
  const navigate = useNavigate();
  const { settings } = useCommitTrack();
  const { t } = useTranslation();

  return (
    <Card className="ct-stack">
      <div>
        <Body className="font-semibold">{t("guide.appGuide.title")}</Body>
        <Caption className="block mt-1">{t("guide.appGuide.subtitle")}</Caption>
      </div>
      <Button type="button" variant="primary" onClick={onStartGuide}>
        {t("guide.startGuide")}
      </Button>

      <div className="border-t border-[var(--ct-border)] pt-4" />

      <div>
        <Body className="font-semibold">{t("guide.setup.title")}</Body>
        <Caption className="block mt-1">{t("guide.setup.subtitle")}</Caption>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => navigate("/onboarding?replay=1", { state: { fromProfile: true } })}
      >
        {t("guide.reviewSetup")}
      </Button>

      {settings.appGuideComplete && (
        <Caption className="block opacity-80">{t("guide.completedNote")}</Caption>
      )}
    </Card>
  );
}
