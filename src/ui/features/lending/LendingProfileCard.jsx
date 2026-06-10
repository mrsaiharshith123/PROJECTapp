import { useState } from "react";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { formatInr } from "../../../constants/symbols.js";
import { shareOrCopyPlainText } from "../../../utils/shareText.js";
import {
  lendingProfileSharePlainText,
  openLendingProfileShareCard,
} from "../../../utils/lendingProfileShare.js";
import { trustScoreToTone } from "../../../engines/lendingTrust.js";
import { semanticToneToClass } from "../../tokens/semanticBadge.js";
import { Caption, Eyebrow } from "../../primitives/Text.jsx";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { cn } from "../../utils/cn.js";

/**
 * @param {{
 *   totals: { lentOut: number, borrowedIn: number, lentOutstanding: number, borrowedOutstanding: number },
 *   trustScore: number | null,
 *   dealCount: number,
 * }} props
 */
export default function LendingProfileCard({ totals, trustScore, dealCount }) {
  const { t } = useTranslation();
  const { settings } = useCommitTrack();
  const { privacyMode, togglePrivacyMode } = useNetWorth();
  const [shareHint, setShareHint] = useState("");

  const shareData = {
    displayName: settings.displayName?.trim() || t("brand.defaultUser"),
    lentTotal: totals.lentOut,
    borrowedTotal: totals.borrowedIn,
    lentOutstanding: totals.lentOutstanding,
    borrowedOutstanding: totals.borrowedOutstanding,
    trustScore,
    activeDeals: dealCount,
  };

  const onShare = async (e) => {
    e.stopPropagation();
    const text = lendingProfileSharePlainText(shareData);
    const r = await shareOrCopyPlainText(text, { title: t("lending.profile.shareTitle") });
    openLendingProfileShareCard(shareData);
    if (r.method === "share") setShareHint(t("lending.profile.shared"));
    else if (r.method === "clipboard") setShareHint(t("lending.profile.copied"));
    else setShareHint("");
    if (r.ok) setTimeout(() => setShareHint(""), 2500);
  };

  const trustTone = trustScore != null ? trustScoreToTone(trustScore) : "neutral";
  const hasTrust = trustScore != null;
  const trustDisplay = hasTrust ? `${trustScore}/100` : t("profileHub.widget.trustEmpty");

  const metrics = [
    { label: t("lending.profile.lentTotal"), value: formatInr(totals.lentOut) },
    {
      label: t("lending.profile.borrowedTotal"),
      value: formatInr(totals.borrowedIn),
      valueClass: "ct-hero-metric-accent",
    },
    { label: t("lending.profile.lentOutstanding"), value: formatInr(totals.lentOutstanding) },
    {
      label: t("lending.profile.borrowedOutstanding"),
      value: formatInr(totals.borrowedOutstanding),
      valueClass: "ct-hero-metric-warn",
    },
  ];

  return (
    <section className="ct-nw-hero ct-lending-profile-hero ct-reveal">
      <div className="ct-nw-hero-glow" aria-hidden />

      <div className="ct-row-between gap-2 flex-wrap relative">
        <div className="text-left">
          <Eyebrow>{t("lending.profile.eyebrow")}</Eyebrow>
          <Caption className="block mt-0.5 font-semibold text-[var(--ct-text)]">
            {t("lending.profile.title")}
          </Caption>
          <Caption className="block mt-0.5 opacity-80">{t("lending.profile.subtitle")}</Caption>
        </div>
        <div className="ct-row gap-1.5 shrink-0">
          <button
            type="button"
            className="ct-privacy-toggle"
            onClick={togglePrivacyMode}
            aria-label={privacyMode ? t("netWorth.privacy.show") : t("netWorth.privacy.hide")}
          >
            <CtIcon name={privacyMode ? "eye-slash" : "eye"} size={18} />
          </button>
          <button type="button" className="ct-lending-share-btn" onClick={onShare}>
            <CtIcon name="arrows-clockwise" size={14} />
            <span>{t("lending.profile.share")}</span>
          </button>
        </div>
      </div>

      {shareHint ? (
        <Caption className="block ct-text-success relative">{shareHint}</Caption>
      ) : null}

      <div className="ct-hero-metrics-row ct-lending-profile-metrics relative">
        {metrics.map((m) => (
          <div key={m.label} className="ct-hero-inset ct-hero-inset-financial">
            <p className="ct-hero-metric-label">{m.label}</p>
            <p className={cn("ct-hero-metric ct-numeral mt-1", m.valueClass)}>
              {privacyMode ? "••••" : m.value}
            </p>
          </div>
        ))}
      </div>

      <div className="ct-lending-trust-row relative">
        <div>
          <Caption className="block font-semibold">{t("profileHub.widget.lendingTrust")}</Caption>
          <Caption className="block opacity-75">{t("lending.trustHint")}</Caption>
        </div>
        <span
          className={cn(
            "ct-lending-trust-badge",
            hasTrust ? semanticToneToClass(trustTone) : "ct-lending-trust-empty",
          )}
        >
          {privacyMode ? "•••" : trustDisplay}
        </span>
      </div>
    </section>
  );
}
