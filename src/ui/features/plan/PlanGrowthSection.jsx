import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToolTile } from "../ToolTile.jsx";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { computeEpfProjection } from "../../../engines/epfTracker.js";
import { formatInr } from "../../../constants/symbols.js";
import { useCountUp } from "../../hooks/useCountUp.js";
import { Caption } from "../../index.js";
import PlanToolSheet from "./PlanToolSheet.jsx";
import { renderPlanToolPanel } from "./planToolPanels.jsx";

const GROWTH_TOOLS = [
  { id: "invest", icon: "chart-line-up", accent: "teal", titleKey: "plan.tools.sip", subtitleKey: "plan.tools.sipSub" },
  { id: "bond", icon: "scroll", accent: "indigo", titleKey: "plan.tools.bond", subtitleKey: "plan.tools.bondSub" },
  { id: "wealth", icon: "chart-bar", accent: "violet", titleKey: "plan.tools.wealth", subtitleKey: "plan.tools.wealthSub" },
  { id: "cibil", icon: "lightning", accent: "indigo", titleKey: "plan.tools.cibil", subtitleKey: "plan.tools.cibilSub" },
  { id: "scenarios", icon: "gear", accent: "amber", titleKey: "plan.tools.scenarios", subtitleKey: "plan.tools.scenariosSub" },
];

/** Investment & growth tools + retirement featured tile. */
export default function PlanGrowthSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const ctx = usePerovo();
  const { settings } = ctx;
  const [activeTool, setActiveTool] = useState(/** @type {string | null} */ (null));

  const corpusEstimate = useMemo(() => {
    const basic = Math.max(0, Number(settings.monthlyIncome) || 0) * 0.4;
    const epf = computeEpfProjection({
      monthlyBasicSalary: basic,
      currentCorpus: Number(settings.epfCorpus) || 0,
      age: Number(settings.age) || 30,
      retirementAge: 60,
    });
    return epf.projectedCorpusAtRetirement;
  }, [settings.monthlyIncome, settings.epfCorpus, settings.age]);

  const animatedCorpus = useCountUp(corpusEstimate, 900);
  const activeMeta = GROWTH_TOOLS.find((x) => x.id === activeTool);

  const openTool = (id) => {
    if (id === "cibil") {
      navigate("/profile/scores");
      return;
    }
    setActiveTool(id);
  };

  return (
    <section className="ct-plan-section">
      <h2 className="ct-plan-section-title">{t("plan.section.growth")}</h2>
      <p className="ct-plan-section-sub">{t("plan.section.growthSub")}</p>

      <div
        role="button"
        tabIndex={0}
        className="ct-hero-card wealth ct-plan-retirement-feature ct-pressable w-full text-left"
        onClick={() => setActiveTool("retirement")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setActiveTool("retirement");
        }}
      >
        <div className="ct-hero-glow teal" aria-hidden />
        <p className="ct-hero-label">{t("plan.retirement.label")}</p>
        <p className="ct-hero-number ct-money-hero-amount">{formatInr(animatedCorpus)}</p>
        <Caption className="block">{t("plan.retirement.basis")}</Caption>
        <span className="ct-btn ct-btn-primary ct-btn-sm mt-3 inline-flex">{t("plan.retirement.cta")}</span>
      </div>

      <div className="ct-plan-grid-2">
        {GROWTH_TOOLS.map((tool) => (
          <ToolTile
            key={tool.id}
            icon={tool.icon}
            title={t(tool.titleKey)}
            subtitle={t(tool.subtitleKey)}
            accent={tool.accent}
            onClick={() => openTool(tool.id)}
          />
        ))}
      </div>

      {activeTool === "retirement" || (activeMeta && activeTool !== "cibil") ? (
        <PlanToolSheet
          open
          onClose={() => setActiveTool(null)}
          icon={activeTool === "retirement" ? "bank" : activeMeta?.icon}
          title={
            activeTool === "retirement" ? t("tools.retirement.title") : t(activeMeta?.titleKey || "")
          }
          accent={activeTool === "retirement" ? "teal" : activeMeta?.accent}
        >
          {renderPlanToolPanel(activeTool, ctx)}
        </PlanToolSheet>
      ) : null}
    </section>
  );
}
