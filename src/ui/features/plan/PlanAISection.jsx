import { useState } from "react";
import { Modal } from "../../primitives/Modal.jsx";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { tierHasFeature } from "../../../utils/tierAccess.js";
import { Button, Caption, Body } from "../../index.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import FinancialAdvisorTool from "../tools/FinancialAdvisorTool.jsx";
import PlansModal from "../profile/PlansModal.jsx";

/** AI advisor — Power/Pro feature card or soft upsell. */
export default function PlanAISection() {
  const { t } = useTranslation();
  const { settings } = usePerovo();
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);
  const hasAi = tierHasFeature("ai_advisor", settings);

  if (hasAi) {
    return (
      <section className="ct-plan-section">
        <h2 className="ct-plan-section-title">{t("plan.section.ai")}</h2>
        <div className="ct-hero-card sim ct-plan-ai-hero">
          <div className="ct-hero-glow" style={{ top: "-20px", right: "-10px" }} aria-hidden />
          <span className="ct-icon-tile violet mb-2" aria-hidden>
            <CtIcon name="chat-dots" size={24} />
          </span>
          <p className="ct-hero-label">{t("plan.ai.label")}</p>
          <Body className="font-semibold text-lg block mt-1">{t("plan.ai.headline")}</Body>
          <Caption className="block mt-1">{t("plan.ai.sub")}</Caption>
          <Button type="button" className="mt-4" onClick={() => setAdvisorOpen(true)}>
            {t("plan.ai.cta")}
          </Button>
        </div>
        {advisorOpen ? (
          <Modal title={t("tools.advisor.title")} onClose={() => setAdvisorOpen(false)} fullScreen>
            <FinancialAdvisorTool />
          </Modal>
        ) : null}
      </section>
    );
  }

  return (
    <section className="ct-plan-section">
      <button type="button" className="ct-plan-ai-upsell ct-pressable" onClick={() => setPlansOpen(true)}>
        <span className="ct-row gap-2 items-center">
          <CtIcon name="lightning" size={18} />
          <span>
            <Body className="font-medium block text-left">{t("plan.ai.lockedTitle")}</Body>
            <Caption className="block text-left">{t("plan.ai.lockedSub")}</Caption>
          </span>
        </span>
        <span className="ct-link text-sm">{t("plan.ai.learnMore")}</span>
      </button>
      {plansOpen ? <PlansModal open onClose={() => setPlansOpen(false)} /> : null}
    </section>
  );
}
