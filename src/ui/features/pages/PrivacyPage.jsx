import { Card, PageHeader, Body, Caption } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";

const CONTACT_EMAIL = "support@committrack.app";

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="ct-page ct-stack">
      <PageHeader title={t("privacy.title")} />
      <Card className="ct-stack max-h-[70vh] overflow-y-auto">
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
          {t("privacy.rightsGrievance", { email: CONTACT_EMAIL })}
        </Body>

        <Body className="font-semibold mt-4">{t("privacy.retentionTitle")}</Body>
        <Body>
          {t("privacy.retentionLocal")}
          {"\n"}
          {t("privacy.retentionCloud")}
        </Body>

        <Body className="font-semibold mt-4">{t("privacy.contactTitle")}</Body>
        <Body>{CONTACT_EMAIL}</Body>
      </Card>
    </div>
  );
}
