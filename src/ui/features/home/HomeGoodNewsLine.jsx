import { useMemo } from "react";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

/** Optional positive insight — hides when nothing genuine to celebrate. */
export default function HomeGoodNewsLine() {
  const { t } = useTranslation();
  const stable = useStabilityIntel();

  const message = useMemo(() => {
    const growth = stable.lifestyle?.growthPercent;
    if (growth != null && growth <= -8) {
      return t("home.goodNews.spendDown", { percent: Math.abs(Math.round(growth)) });
    }
    const strength = stable.healthNarrative?.strengths?.[0];
    if (strength?.key) {
      return t(strength.key, strength.params);
    }
    return null;
  }, [stable.lifestyle?.growthPercent, stable.healthNarrative?.strengths, t]);

  if (!message) return null;

  return (
    <p className="ct-home-good-news ct-home-enter-item" style={{ animationDelay: "180ms" }}>
      <CtIcon name="check-circle" size={16} weight="fill" aria-hidden />
      <span>{message}</span>
    </p>
  );
}
