import { useUpdateTestTranslation } from "../../app/UpdateTestShellI18n.jsx";
import UpdateProgressModal from "./UpdateProgressModal.jsx";
import { useUpdateTestShellAction } from "../../hooks/useUpdateTestShellAction.js";
import { getLocalAppVersion } from "../../services/appUpdate.js";

function UpdateTestShellView({ status, busy, runUpdate, runReset }) {
  const { t } = useUpdateTestTranslation();
  const version = getLocalAppVersion();

  return (
    <div className="ct-update-test-shell">
      <div className="ct-update-test-inner">
        <span className="ct-update-test-icon" aria-hidden>
          ↻
        </span>
        <h1 className="ct-update-test-title">{t("updateTestShell.title")}</h1>
        <p className="ct-update-test-body">{t("updateTestShell.body")}</p>
        <p className="ct-update-test-version">{t("updateTestShell.version", { version })}</p>
        <button type="button" className="ct-update-test-btn" onClick={runUpdate} disabled={busy}>
          {busy ? t("support.updateAppApplying") : t("updateTestShell.button")}
        </button>
        <button type="button" className="ct-update-test-btn ct-update-test-btn-secondary" onClick={runReset} disabled={busy}>
          {t("updateTestShell.reset")}
        </button>
        {status ? <p className="ct-update-test-status">{status}</p> : null}
      </div>
    </div>
  );
}

/** Temporary — bare screen with one Update button for testing the update flow. */
export default function UpdateTestShell() {
  const api = useUpdateTestShellAction();
  return (
    <div className="ct-stack">
      <UpdateTestShellView {...api} />
      <UpdateProgressModal open={api.progressOpen} progress={api.progress} />
    </div>
  );
}
