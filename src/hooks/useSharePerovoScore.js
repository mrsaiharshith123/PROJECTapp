import { useCallback, useState } from "react";
import { useTranslation } from "../i18n/I18nProvider.js";
import { usePerovoScore } from "./usePerovoScore.js";
import { useStabilityIntel } from "./useStabilityIntel.js";
import { useCommitIntel } from "./useCommitIntel.js";
import { formatInr } from "../constants/symbols.js";
import { renderScoreShareCardPng, shareScoreCardImage } from "../utils/shareCardImage.js";

/** Share Perovo score as PNG image + perovo.app link (Web Share API or download). */
export function useSharePerovoScore() {
  const { t } = useTranslation();
  const perovo = usePerovoScore();
  const stable = useStabilityIntel();
  const { freeCash } = useCommitIntel();
  const [sharing, setSharing] = useState(false);

  const shareScore = useCallback(async () => {
    if (sharing) return null;
    setSharing(true);
    try {
      const survivalMonths = stable.survival?.survivalMonths ?? perovo.survivalMonths ?? null;
      const runway =
        survivalMonths != null && Number.isFinite(survivalMonths)
          ? `${Number(survivalMonths).toFixed(1)} ${t("scoreDetail.monthsShort")}`
          : "—";

      const blob = await renderScoreShareCardPng({
        score: perovo.score ?? 0,
        tierLabel: t(`perovoScore.tier.${perovo.tier?.id}`),
        tierTone: perovo.tier?.tone,
        freeCashLabel: t("home.freeCash"),
        freeCash: formatInr(freeCash ?? 0),
        runwayLabel: t("scoreDetail.runway"),
        runway,
        brandName: t("brand.appName"),
        subtitle: t("share.subtitle"),
        brandLine: t("share.brandLine"),
      });
      return await shareScoreCardImage(blob, { title: t("share.title") });
    } catch {
      return null;
    } finally {
      setSharing(false);
    }
  }, [sharing, perovo, stable, freeCash, t]);

  return { shareScore, sharing };
}
