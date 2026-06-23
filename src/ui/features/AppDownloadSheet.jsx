import { useEffect, useState } from "react";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { Modal } from "../primitives/Modal.jsx";
import { Body, Caption } from "../primitives/Text.jsx";
import { CtIcon } from "../icons/CtIcon.jsx";
import { usePwaInstall } from "../../hooks/usePwaInstall.js";
import { requestInstallPlatform, getIosDownloadUrl } from "../../utils/appDownload.js";
import { fetchAppReleases, triggerApkDownload } from "../../utils/appReleases.js";

const PLATFORMS = [
  { id: "windows", icon: "laptop", labelKey: "download.platform.windows", hintKey: "download.platform.windowsHint", tone: "indigo" },
  { id: "android", icon: "device-mobile", labelKey: "download.platform.android", hintKey: "download.platform.androidHint", tone: "teal" },
  { id: "ios", icon: "device-mobile", labelKey: "download.platform.ios", hintKey: "download.platform.iosHint", tone: "violet" },
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

  const handleClose = () => {
    setStep("platform");
    setReleases([]);
    setLoadingReleases(false);
    onClose();
  };

  useEffect(() => {
    if (step !== "android") return undefined;
    let cancelled = false;
    fetchAppReleases().then((list) => {
      if (!cancelled) {
        setReleases(list.filter((r) => r.androidApkUrl));
        setLoadingReleases(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [step]);

  if (!open) return null;

  const onSelectPlatform = async (platform) => {
    requestInstallPlatform(platform);

    if (platform === "android") {
      setLoadingReleases(true);
      setReleases([]);
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
      <Modal sheet darkSheet title={t("download.androidVersionsTitle")} onClose={handleClose}>
        <div className="ct-nw-panel ct-stack-sm !p-0 !border-0 !bg-transparent">
          <button
            type="button"
            className="ct-btn ct-btn-ghost ct-btn-sm mb-1 -mt-1 self-start"
            onClick={() => setStep("platform")}
          >
            {t("download.backToPlatforms")}
          </button>
          <Body className="mb-2">{t("download.androidVersionsBody")}</Body>
          {loadingReleases ? (
            <Caption>{t("webLanding.versionsLoading")}</Caption>
          ) : (
            <ul className="ct-stack-sm">
              {releases.map((release) => (
                <li key={release.version}>
                  <button
                    type="button"
                    className="ct-stat-tile teal w-full !text-left ct-pressable"
                    onClick={() => onSelectAndroidRelease(release)}
                  >
                    <span className="ct-row gap-3 items-start">
                      <span className="ct-icon-tile ct-icon-tile-sm teal shrink-0" aria-hidden>
                        <CtIcon name="device-mobile" size={18} weight="duotone" />
                      </span>
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
        </div>
      </Modal>
    );
  }

  return (
    <Modal sheet darkSheet title={t("download.sheetTitle")} onClose={handleClose}>
      <div className="ct-nw-panel ct-stack-sm !p-0 !border-0 !bg-transparent">
        <Body className="mb-2">{t("download.sheetBody")}</Body>
        <ul className="ct-stack-sm">
          {PLATFORMS.map(({ id, icon, labelKey, hintKey, tone }) => (
            <li key={id}>
              <button
                type="button"
                className={`ct-stat-tile ${tone} w-full !text-left ct-pressable`}
                onClick={() => onSelectPlatform(id)}
              >
                <span className="ct-row gap-3 items-start">
                  <span className={`ct-icon-tile ct-icon-tile-sm ${tone} shrink-0`} aria-hidden>
                    <CtIcon name={icon} size={18} weight="duotone" />
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
      </div>
    </Modal>
  );
}
