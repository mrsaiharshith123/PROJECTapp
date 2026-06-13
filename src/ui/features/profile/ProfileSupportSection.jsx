import { useNavigate } from "react-router-dom";
import { Card, Body, Caption, Heading } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { PerovoBrand } from "../../brand/PerovoBrand.jsx";

const APP_VERSION = import.meta.env.VITE_APP_VERSION || "0.0.0";

export default function ProfileSupportSection({ onOpenGuide }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card className="ct-stack">
      <div>
        <Heading level={3}>{t("support.title")}</Heading>
        <Caption className="block mt-1">{t("support.subtitle")}</Caption>
      </div>

      <button type="button" className="ct-list-row w-full text-left" onClick={onOpenGuide}>
        <Body className="font-semibold">{t("support.helpCenter")}</Body>
        <Caption className="block mt-0.5">{t("support.helpCenterHint")}</Caption>
      </button>

      <button type="button" className="ct-list-row w-full text-left" onClick={() => navigate("/privacy")}>
        <Body className="font-semibold">{t("support.privacy")}</Body>
        <Caption className="block mt-0.5">{t("support.privacyHint")}</Caption>
      </button>

      <a href={`mailto:${t("support.contactEmail")}`} className="ct-list-row w-full text-left no-underline">
        <Body className="font-semibold">{t("support.contact")}</Body>
        <Caption className="block mt-0.5">{t("support.contactHint")}</Caption>
        <Caption className="ct-text-accent block mt-1">{t("support.contactEmail")}</Caption>
      </a>

      <div className="ct-stack-sm pt-2 border-t border-[var(--ct-border)]">
        <Body className="font-semibold">{t("support.about")}</Body>
        <Caption className="block">{t("support.aboutBody")}</Caption>
        <Caption className="block opacity-80">{t("support.version", { version: APP_VERSION })}</Caption>
        <div className="flex justify-center pt-1">
          <PerovoBrand layout="column" iconSize="sm" wordmarkSize="sm" />
        </div>
      </div>
    </Card>
  );
}
