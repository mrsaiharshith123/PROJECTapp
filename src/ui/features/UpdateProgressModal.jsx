import { useTranslation } from "../../i18n/I18nProvider.js";
import { formatBytes } from "../../utils/formatBytes.js";

export default function UpdateProgressModal({ open, progress }) {
  const { t } = useTranslation();
  if (!open) return null;

  const percent = Math.min(100, Math.max(0, progress?.percent ?? 0));
  const loaded = progress?.bytesLoaded;
  const total = progress?.bytesTotal;

  const phaseLabel =
    progress?.phase === "restarting"
      ? t("support.updateAppRestarting")
      : progress?.phase === "installing"
        ? t("support.updateAppApkInstalling")
        : progress?.phase === "checking"
          ? t("support.updateAppChecking")
          : t("support.updateAppDownloading");

  const sizeLine =
    loaded != null && total
      ? `${formatBytes(loaded)} / ${formatBytes(total)}`
      : `${percent}%`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      role="dialog"
      aria-modal="true"
      aria-busy="true"
    >
      <div
        style={{
          background: "var(--ed-bg, var(--color-bg))",
          borderRadius: 16,
          padding: "24px 20px",
          width: "min(320px, calc(100vw - 40px))",
          boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
        }}
      >
        <p
          style={{
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            marginBottom: 4,
          }}
        >
          {t("support.updateAppApplying")}
        </p>
        <p
          style={{
            fontSize: 13,
            color: "var(--ed-muted, var(--color-muted))",
            marginBottom: 16,
          }}
        >
          {phaseLabel}
        </p>
        <div
          style={{
            height: 6,
            borderRadius: 3,
            background: "var(--ed-surface, var(--color-surface))",
            overflow: "hidden",
          }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div
            style={{
              height: "100%",
              width: `${percent}%`,
              background: "var(--ed-accent, var(--color-accent))",
              borderRadius: 3,
              transition: "width 0.2s ease",
            }}
          />
        </div>
        <p
          style={{
            fontSize: 12,
            color: "var(--ed-muted, var(--color-muted))",
            textAlign: "center",
            marginTop: 10,
          }}
        >
          {sizeLine}
        </p>
      </div>
    </div>
  );
}
