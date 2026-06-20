import { useTranslation } from "../../i18n/I18nProvider.js";
import { Body, Caption, Heading } from "../primitives/Text.jsx";
import { formatBytes } from "../../utils/formatBytes.js";

/**
 * @param {{
 *   open: boolean,
 *   progress?: { phase?: string, percent?: number, bytesLoaded?: number, bytesTotal?: number } | null,
 * }} props
 */
export default function UpdateProgressModal({ open, progress }) {
  const { t } = useTranslation();
  if (!open) return null;

  const percent = Math.min(100, Math.max(0, progress?.percent ?? 0));
  const loaded = progress?.bytesLoaded;
  const total = progress?.bytesTotal;
  const sizeLine =
    loaded != null && total
      ? t("support.updateAppProgress", {
          loaded: formatBytes(loaded),
          total: formatBytes(total),
          percent: String(percent),
        })
      : t("support.updateAppProgressPercent", { percent: String(percent) });

  const phaseKey =
    progress?.phase === "restarting"
      ? "support.updateAppRestarting"
      : progress?.phase === "checking"
        ? "support.updateAppChecking"
        : "support.updateAppDownloading";

  return (
    <div className="ct-update-progress-overlay" role="dialog" aria-modal="true" aria-busy="true">
      <div className="ct-update-progress-panel">
        <Heading level={2} className="mb-3 text-base">
          {t("support.updateAppApplying")}
        </Heading>
        <Body className="mb-4 text-sm">{t(phaseKey)}</Body>
        <div
          className="ct-update-progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div className="ct-update-progress-fill" style={{ width: `${percent}%` }} />
        </div>
        <Caption className="block mt-3 text-center">{sizeLine}</Caption>
      </div>
    </div>
  );
}
