import { useTranslation } from "../../i18n/I18nProvider.js";
import { Modal } from "../primitives/Modal.jsx";
import { Body, Caption } from "../primitives/Text.jsx";
import { CtIcon } from "../icons/CtIcon.jsx";
import { usePwaInstall } from "../../hooks/usePwaInstall.js";
import {
  requestInstallPlatform,
  getAndroidDownloadUrl,
  getIosDownloadUrl,
  apkDownloadLinkProps,
} from "../../utils/appDownload.js";

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

  if (!open) return null;

  const onSelect = async (platform) => {
    requestInstallPlatform(platform);

    if (platform === "android") {
      const url = getAndroidDownloadUrl();
      const props = apkDownloadLinkProps(url);
      if (props.download) {
        const a = document.createElement("a");
        a.href = url;
        a.download = props.download;
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      onClose();
      return;
    }

    if (platform === "ios") {
      window.open(getIosDownloadUrl(), "_blank", "noopener,noreferrer");
      onClose();
      return;
    }

    if (platform === "windows") {
      await install();
      onClose();
    }
  };

  return (
    <Modal sheet title={t("download.sheetTitle")} onClose={onClose}>
      <Body className="mb-4">{t("download.sheetBody")}</Body>
      <ul className="ct-stack-sm">
        {PLATFORMS.map(({ id, icon, labelKey, hintKey }) => (
          <li key={id}>
            <button type="button" className="ct-option-card w-full !text-left !py-3" onClick={() => onSelect(id)}>
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
