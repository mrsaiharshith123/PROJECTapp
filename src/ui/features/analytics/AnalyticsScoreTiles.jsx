import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { usePerovoScore } from "../../../hooks/usePerovoScore.js";
import { PEROVO_PILLARS } from "../../../constants/metricTaxonomy.js";
import { useCountUp } from "../../hooks/useCountUp.js";
import { MetricCard } from "../../patterns/MetricCard.jsx";
import { formatInr } from "../../../constants/symbols.js";

/** Perovo Score hero + four pillar tiles for Analytics (research Stage 4). */
export default function AnalyticsScoreTiles() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const perovo = usePerovoScore();
  const animatedScore = useCountUp(perovo.score, 900);

  const openDetail = (pillar) => {
    navigate("/profile/scores", { state: pillar ? { pillar } : {} });
  };

  return (
    <section className="ct-stack-sm" aria-label={t("perovoScore.title")}>
      <button
        type="button"
        className="ct-hero-card pressure w-full text-left ct-pressable"
        onClick={() => openDetail()}
      >
        <div className="ct-hero-glow" aria-hidden />
        <p className="ct-hero-label">{t("perovoScore.title")}</p>
        <p className="ct-hero-number ct-numeral relative">
          {animatedScore}
          <span className="text-lg font-normal opacity-75">/100</span>
        </p>
        <p className="text-xs font-medium mt-1 relative opacity-90">
          {t(`perovoScore.tier.${perovo.tier.id}`)}
        </p>
      </button>

      <div className="ct-grid-2 gap-2">
        {PEROVO_PILLARS.map((pillar) => {
          const data = perovo.pillars[pillar.id];
          return (
            <MetricCard
              key={pillar.id}
              label={t(`perovoScore.pillar.${pillar.id}`)}
              value={data?.score ?? 0}
              animateValue
              trend={data?.trend ?? null}
              icon={pillar.icon}
              tone={pillar.tone}
              context={
                pillar.id === "cashflow" && perovo.freeCash > 0
                  ? t("perovoScore.pillarContext.cashflow", {
                      amount: formatInr(Math.round(perovo.freeCash)),
                    })
                  : pillar.id === "savings" && perovo.survivalMonths != null
                    ? t("perovoScore.pillarContext.savings", {
                        months: Math.min(99, Math.round(perovo.survivalMonths)),
                      })
                    : undefined
              }
              onClick={() => openDetail(pillar.id)}
            />
          );
        })}
      </div>
    </section>
  );
}
