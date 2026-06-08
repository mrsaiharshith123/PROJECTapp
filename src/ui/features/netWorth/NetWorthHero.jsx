import { formatInr } from "../../../constants/symbols.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useCountUp } from "../../hooks/useCountUp.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { Caption, Body } from "../../index.js";
import { NetWorthSparkline } from "./NetWorthSparkline.jsx";

/** @param {{ intel: object, privacyMode: boolean }} props */
export function NetWorthHeroBody({ intel, privacyMode }) {
  const { t } = useTranslation();
  const animated = useCountUp(intel.core.netWorth);
  const display = privacyMode ? "••••••" : formatInr(animated);

  const monthly = intel.growth.monthlyPct;
  const yearly = intel.growth.yearlyPct;

  return (
    <>
      <div className="ct-row-between">
        <Caption className="ct-nw-eyebrow">{t("netWorth.hero.eyebrow")}</Caption>
        <span className={`ct-nw-status ct-nw-status-${intel.emotionalStatus}`}>
          {t(intel.emotionalStatusKey)}
        </span>
      </div>
      <p className="ct-nw-hero-value ct-numeral">{display}</p>
      <div className="ct-row-between mt-2 flex-wrap gap-2">
        <div className="ct-row gap-3">
          {monthly != null && (
            <span className={`ct-nw-delta ${monthly >= 0 ? "ct-nw-delta-up" : "ct-nw-delta-down"}`}>
              <CtIcon name={monthly >= 0 ? "chart-line-up" : "chart-line-down"} size={14} />
              {monthly >= 0 ? "+" : ""}
              {monthly.toFixed(1)}% {t("netWorth.hero.thisMonth")}
            </span>
          )}
          {yearly != null && (
            <Caption>
              {yearly >= 0 ? "+" : ""}
              {yearly.toFixed(1)}% {t("netWorth.hero.thisYear")}
            </Caption>
          )}
        </div>
        {!privacyMode && intel.growth.trend.length > 1 && <NetWorthSparkline data={intel.growth.trend} />}
      </div>
      <div className="ct-grid-3 gap-2 mt-4">
        <div className="ct-nw-metric-pill">
          <Caption>{t("netWorth.hero.liquid")}</Caption>
          <Body className="ct-numeral !text-sm font-semibold">
            {privacyMode ? "••••" : formatInr(intel.core.liquidNetWorth)}
          </Body>
        </div>
        <div className="ct-nw-metric-pill">
          <Caption>{t("netWorth.hero.safety")}</Caption>
          <Body className="ct-numeral !text-sm font-semibold">
            {privacyMode ? "••••" : formatInr(intel.core.accessibleSafety)}
          </Body>
        </div>
        <div className="ct-nw-metric-pill">
          <Caption>{t("netWorth.hero.lifeScore")}</Caption>
          <Body className="ct-numeral !text-sm font-semibold">{intel.lifeScore.score}</Body>
        </div>
      </div>
    </>
  );
}

export default function NetWorthHero({ intel, privacyMode }) {
  return (
    <section className="ct-nw-hero ct-animate-fade-up">
      <div className="ct-nw-hero-glow" aria-hidden />
      <NetWorthHeroBody intel={intel} privacyMode={privacyMode} />
    </section>
  );
}
