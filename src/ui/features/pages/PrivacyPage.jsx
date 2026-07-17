import { useNavigate } from "react-router-dom";
import { PageShell, Body, Caption } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";

export default function PrivacyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const contactEmail = t("support.contactEmail");

  return (
    <PageShell
      title={t("privacy.title")}
      action={
        <button type="button" className="ed-btn ed-btn-ghost ed-btn-sm" onClick={() => navigate(-1)} aria-label={t("common.back")}>
          ←
        </button>
      }
    >
      <div className="ed-inset relative max-h-[70vh] overflow-y-auto ed-stack">
        <Caption className="block">{t("privacy.effective")}</Caption>

        <Body className="font-semibold mt-4">{t("privacy.collectTitle")}</Body>
        <Body>{t("privacy.collectBody")}</Body>

        <Body className="font-semibold mt-4">{t("privacy.whyTitle")}</Body>
        <Body>{t("privacy.whyBody")}</Body>

        <Body className="font-semibold mt-4">{t("privacy.whereTitle")}</Body>
        <Body>{t("privacy.whereBody")}</Body>

        <Body className="font-semibold mt-4">{t("privacy.notTitle")}</Body>
        <Body>{t("privacy.notBody")}</Body>

        <Body className="font-semibold mt-4">{t("privacy.rightsTitle")}</Body>
        <Body>
          {t("privacy.rightsAccess")}
          {"\n"}
          {t("privacy.rightsCorrection")}
          {"\n"}
          {t("privacy.rightsErasure")}
          {"\n"}
          {t("privacy.rightsGrievance", { email: contactEmail })}
        </Body>

        <Body className="font-semibold mt-4">{t("privacy.retentionTitle")}</Body>
        <Body>
          {t("privacy.retentionLocal")}
          {"\n"}
          {t("privacy.retentionCloud")}
        </Body>

        <Body className="font-semibold mt-4">{t("privacy.contactTitle")}</Body>
        <Body>{contactEmail}</Body>
      </div>
    </PageShell>
  );
}
