import { useMemo, useState } from "react";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { formatInr } from "../../../constants/symbols.js";
import { Button } from "../../primitives/Button.jsx";
import { renderScoreShareCardPng, shareScoreCardImage } from "../../../utils/shareCardImage.js";

function tierRingColor(tone) {
  if (tone === "success" || tone === "ok") return "#2dd4bf";
  if (tone === "warning" || tone === "warn" || tone === "mid") return "#fbbf24";
  return "#f87171";
}

/**
 * Shareable score card — 375×220 screenshot-friendly layout.
 * @param {{
 *   score: number,
 *   tierLabel: string,
 *   tierTone?: string,
 *   freeCash: number,
 *   runwayMonths?: number | null,
 *   headline?: string,
 *   variant?: "score" | "payoff",
 *   loanName?: string,
 *   onShareComplete?: () => void,
 * }} props
 */
export default function PerovoShareCard({
  score,
  tierLabel,
  tierTone = "success",
  freeCash,
  runwayMonths,
  headline,
  variant = "score",
  loanName,
  onShareComplete,
}) {
  const { t } = useTranslation();
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const ringColor = tierRingColor(tierTone);
  const filledDeg = Math.max(0, Math.min(360, (score / 100) * 360));

  const runway =
    runwayMonths != null && Number.isFinite(runwayMonths)
      ? `${Number(runwayMonths).toFixed(1)} ${t("scoreDetail.monthsShort")}`
      : "—";

  const displayHeadline = useMemo(() => {
    if (headline) return headline;
    if (variant === "payoff" && loanName) return t("share.payoffHeadline", { name: loanName });
    return null;
  }, [headline, variant, loanName, t]);

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const blob = await renderScoreShareCardPng({
        score,
        tierLabel,
        tierTone,
        freeCashLabel: t("home.freeCash"),
        freeCash: formatInr(freeCash),
        runwayLabel: t("scoreDetail.runway"),
        runway,
        brandName: t("brand.appName"),
        subtitle: t("share.subtitle"),
        brandLine: t("share.brandLine"),
      });
      const result = await shareScoreCardImage(blob, { title: t("share.title") });
      if (result.method === "download") {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
      onShareComplete?.();
    } catch {
      /* user cancelled share */
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="ct-stack-sm">
      <div
        className="ct-share-card"
        style={{
          width: "100%",
          maxWidth: 375,
          margin: "0 auto",
          background: "linear-gradient(135deg, #0d0e18 0%, #181930 100%)",
          border: "0.5px solid rgba(99,102,241,0.3)",
          borderRadius: 20,
          padding: 20,
          boxSizing: "border-box",
        }}
      >
        <div className="ct-row-between items-start gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ct-text-muted)]">
              {t("brand.appName")}
            </p>
            <p className="text-sm font-semibold text-[var(--ct-text)] mt-0.5">{t("share.subtitle")}</p>
          </div>
          <div
            className="ct-conic-ring shrink-0"
            style={{
              width: 64,
              height: 64,
              background: `conic-gradient(${ringColor} 0deg ${filledDeg}deg, rgba(255,255,255,0.08) ${filledDeg}deg 360deg)`,
            }}
          >
            <div className="ct-conic-ring-inner" style={{ width: 50, height: 50 }}>
              <span className="text-base font-semibold ct-numeral leading-none">{score}</span>
            </div>
          </div>
        </div>

        <p className="text-xs mt-2" style={{ color: ringColor }}>
          {tierLabel}
        </p>

        <div className="ct-row gap-4 mt-3 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[var(--ct-text-muted)]">{t("home.freeCash")}</p>
            <p className="font-semibold ct-numeral" style={{ color: "#fcd34d" }}>
              {formatInr(freeCash)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[var(--ct-text-muted)]">{t("scoreDetail.runway")}</p>
            <p className="font-semibold ct-numeral" style={{ color: "#fbbf24" }}>
              {runway}
            </p>
          </div>
        </div>

        <div
          className="mt-3 pt-3"
          style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)" }}
        >
          {displayHeadline ? (
            <p className="text-xs text-[var(--ct-text-secondary)] leading-snug">{displayHeadline}</p>
          ) : null}
          <p className="text-[10px] text-[var(--ct-text-muted)] mt-2 text-right">{t("share.brandLine")}</p>
        </div>
      </div>

      <Button type="button" variant="primary" className="w-full" onClick={handleShare} disabled={sharing}>
        {copied ? t("share.copied") : sharing ? t("common.loading") : t("share.shareButton")}
      </Button>
    </div>
  );
}
