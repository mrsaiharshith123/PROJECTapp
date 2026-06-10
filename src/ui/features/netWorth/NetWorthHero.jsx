import { ResponsiveContainer, LineChart, Line } from "recharts";
import { formatInr } from "../../../constants/symbols.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useCountUp } from "../../hooks/useCountUp.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { Caption, Body } from "../../index.js";

function NetWorthSparkline({ data }) {
  if (!data?.length) return null;
  const color = data[data.length - 1].value >= (data[0]?.value || 0) ? "#34d399" : "#f87171";
  return (
    <div className="ct-nw-sparkline" aria-hidden>
      <ResponsiveContainer width="100%" height={36}>
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** @param {{ intel: object, privacyMode: boolean, compact?: boolean }} props */
export function NetWorthHeroBody({ intel, privacyMode, compact = false }) {
  const { t } = useTranslation();
  const animated = useCountUp(intel.core.netWorth);
  const display = privacyMode ? "••••••" : formatInr(animated);

  const monthly = intel.growth.monthlyPct;
  const yearly = intel.growth.yearlyPct;

  return (
    <>
      <div className="ct-row-between">
        <Caption className="ct-nw-eyebrow">{t("netWorth.hero.eyebrow")}</Caption>
        {!privacyMode ? (
          <span className={`ct-nw-status ct-nw-status-${intel.emotionalStatus}`}>
            {t(intel.emotionalStatusKey)}
          </span>
        ) : null}
      </div>
      <p className="ct-nw-hero-value ct-numeral">{display}</p>
      <div className="ct-row-between mt-2 flex-wrap gap-2">
        {!privacyMode ? (
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
        ) : (
          <span />
        )}
        {!privacyMode && intel.growth.trend.length > 1 && <NetWorthSparkline data={intel.growth.trend} />}
      </div>
      {!compact && (
        <div className="ct-grid-2 gap-2 mt-4">
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
        </div>
      )}
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
