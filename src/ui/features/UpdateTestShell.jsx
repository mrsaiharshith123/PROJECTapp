import { useTranslation } from "../../i18n/I18nProvider.js";
import { useAppUpdateAction } from "../../hooks/useAppUpdateAction.js";
import { getLocalAppVersion } from "../../services/appUpdate.js";
import { Body, Caption, Heading } from "../primitives/Text.jsx";
import { CtIcon } from "../icons/CtIcon.jsx";

/** Temporary — bare screen with one Update button for testing the update flow. */
export default function UpdateTestShell() {
  const { t } = useTranslation();
  const { status, busy, runUpdate } = useAppUpdateAction();
  const version = getLocalAppVersion();

  return (
    <div className="ct-screen ct-update-test-shell">
      <div className="ct-update-test-inner">
        <span className="ct-update-test-icon" aria-hidden>
          <CtIcon name="arrows-clockwise" size={40} weight="duotone" />
        </span>
        <Heading level={1} className="ct-update-test-title">
          {t("updateTestShell.title")}
        </Heading>
        <Body className="ct-update-test-body">{t("updateTestShell.body")}</Body>
        <Caption className="ct-update-test-version">
          {t("updateTestShell.version", { version })}
        </Caption>
        <button
          type="button"
          className="ct-btn ct-btn-primary ct-btn-lg ct-update-test-btn"
          onClick={runUpdate}
          disabled={busy}
        >
          {busy ? t("support.updateAppApplying") : t("updateTestShell.button")}
        </button>
        {status ? <Caption className="ct-update-test-status">{status}</Caption> : null}
      </div>
    </div>
  );
}
