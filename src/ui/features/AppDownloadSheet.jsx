import { useEffect, useState } from "react";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { Modal } from "../primitives/Modal.jsx";
import { Body, Caption } from "../primitives/Text.jsx";
import { CtIcon } from "../icons/CtIcon.jsx";
import { usePwaInstall } from "../../hooks/usePwaInstall.js";
import { requestInstallPlatform, getIosDownloadUrl } from "../../utils/appDownload.js";
import { fetchAppReleases, triggerApkDownload } from "../../utils/appReleases.js";

const PLATFORMS = [
  { id: "windows", icon: "laptop", labelKey: "download.platform.windows", hintKey: "download.platform.windowsHint" },
  { id: "android", icon: "device-mobile", labelKey: "download.platform.android", hintKey: "download.platform.androidHint" },
  { id: "ios", icon: "device-mobile", labelKey: "download.platform.ios", hintKey: "download.platform.iosHint" },
];

/**
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function AppDownloadSheet({ open, onClose }) {
  const { t } = useTranslation();
  const { install } = usePwaInstall();
  const [step, setStep] = useState("platform");
  const [releases, setReleases] = useState([]);
  const [loadingReleases, setLoadingReleases] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep("platform");
      return;
    }
    let cancelled = false;
    setLoadingReleases(true);
    fetchAppReleases().then((list) => {
      if (!cancelled) {
        setReleases(list.filter((r) => r.androidApkUrl));
        setLoadingReleases(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const handleClose = () => {
    setStep("platform");
    onClose();
  };

  const onSelectPlatform = async (platform) => {
    requestInstallPlatform(platform);

    if (platform === "android") {
      setStep("android");
      return;
    }

    if (platform === "ios") {
      window.open(getIosDownloadUrl(), "_blank", "noopener,noreferrer");
      handleClose();
      return;
    }

    if (platform === "windows") {
      await install();
      handleClose();
    }
  };

  const onSelectAndroidRelease = (release) => {
    if (!release.androidApkUrl) return;
    triggerApkDownload(release.androidApkUrl, release.version);
    handleClose();
  };

  if (step === "android") {
    return (
      <Modal sheet title={t("download.androidVersionsTitle")} onClose={handleClose}>
        <button
          type="button"
          className="ct-btn ct-btn-ghost ct-btn-sm mb-3 -mt-1"
          onClick={() => setStep("platform")}
        >
          {t("download.backToPlatforms")}
        </button>
        <Body className="mb-4">{t("download.androidVersionsBody")}</Body>
        {loadingReleases ? (
          <Caption>{t("webLanding.versionsLoading")}</Caption>
        ) : (
          <ul className="ct-stack-sm">
            {releases.map((release) => (
              <li key={release.version}>
                <button
                  type="button"
                  className="ct-option-card w-full !text-left !py-3"
                  onClick={() => onSelectAndroidRelease(release)}
                >
                  <span className="ct-row gap-3 items-start">
                    <span className="ct-landing-version-badge shrink-0">{release.version}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[var(--ct-text)]">
                        {release.label || release.version}
                      </span>
                      <Caption className="block mt-0.5">{t("download.platform.androidHint")}</Caption>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    );
  }

  return (
    <Modal sheet title={t("download.sheetTitle")} onClose={handleClose}>
      <Body className="mb-4">{t("download.sheetBody")}</Body>
      <ul className="ct-stack-sm">
        {PLATFORMS.map(({ id, icon, labelKey, hintKey }) => (
          <li key={id}>
            <button type="button" className="ct-option-card w-full !text-left !py-3" onClick={() => onSelectPlatform(id)}>
              <span className="ct-row gap-3 items-start">
                <span className="ct-landing-feature-icon shrink-0" aria-hidden>
                  <CtIcon name={icon} size={22} weight="duotone" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[var(--ct-text)]">{t(labelKey)}</span>
                  <Caption className="block mt-0.5">{t(hintKey)}</Caption>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
