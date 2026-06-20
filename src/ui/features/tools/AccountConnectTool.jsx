import { useState } from "react";
import { Button, Caption, Body, Heading, Stack } from "../../index.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { ToolAnswerHero } from "../../patterns/ToolAnswerHero.jsx";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { createConsentRequest, isAaConfigured } from "../../../services/aa/setuAggregator.js";

export default function AccountConnectTool() {
  const { t } = useTranslation();
  const { settings, updateSettings } = usePerovo();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const notifyInterest = () => {
    updateSettings({ aaInterest: true });
    setMessage(t("tools.accountConnect.notified"));
  };

  const tryBeta = async () => {
    setBusy(true);
    setMessage("");
    const phone = settings.phoneNumber || "";
    const result = await createConsentRequest({ phone });
    setBusy(false);
    if (result.consentUrl) {
      window.open(result.consentUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setMessage(result.error || t("tools.accountConnect.error"));
  };

  return (
    <Stack>
      <ToolAnswerHero
        tone="wealth"
        label={t("tools.accountConnect.heroLabel")}
        subtitle={t("tools.accountConnect.heroSubtitle")}
      >
        <span className="ct-icon-tile teal inline-flex" aria-hidden>
          <CtIcon name="bank" size={22} />
        </span>
      </ToolAnswerHero>
      <Heading level={3}>{t("tools.accountConnect.title")}</Heading>
      <Caption>{t("tools.accountConnect.intro")}</Caption>
      {message ? <Caption className="ct-text-accent block">{message}</Caption> : null}
      {isAaConfigured() ? (
        <Button type="button" variant="primary" disabled={busy} onClick={tryBeta}>
          {t("tools.accountConnect.tryBeta")}
        </Button>
      ) : (
        <Button type="button" variant="primary" onClick={notifyInterest} disabled={settings.aaInterest}>
          {settings.aaInterest ? t("tools.accountConnect.notified") : t("tools.accountConnect.notify")}
        </Button>
      )}
      {!isAaConfigured() && settings.aaInterest ? (
        <Body className="!text-sm">{t("tools.accountConnect.notified")}</Body>
      ) : null}
    </Stack>
  );
}
