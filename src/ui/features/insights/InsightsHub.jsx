import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { PageShell } from "../../index.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import InsightSectionCarousel from "./InsightSectionCarousel.jsx";
import { findSectionForCard, INSIGHT_SECTIONS } from "./insightSectionsConfig.js";

/** Main Insights hub — stacked category sections, each with its own swipe carousel. */
export default function InsightsHub({ data, nested = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusCard = searchParams.get("card");
  const focusSection = findSectionForCard(focusCard);
  const scrolledRef = useRef(false);

  useEffect(() => {
    if (!focusSection || scrolledRef.current) return;
    scrolledRef.current = true;
    const el = document.getElementById(`insight-section-${focusSection.id}`);
    if (el) {
      requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }, [focusSection]);

  const sections = (
    <div className="ct-insights-hub-sections" style={{ paddingTop: nested ? 8 : 0 }}>
      {INSIGHT_SECTIONS.map((section) => (
        <InsightSectionCarousel
          key={section.id}
          section={section}
          data={data}
          initialCardId={focusSection?.id === section.id ? focusCard : null}
        />
      ))}
    </div>
  );

  if (nested) {
    return <div className="ct-insights-hub">{sections}</div>;
  }

  return (
    <PageShell
      title={t("nav.insights")}
      action={
        <button
          type="button"
          className="ct-btn ct-btn-ghost ct-btn-sm"
          onClick={() => navigate("/ledger/spends")}
        >
          <CtIcon name="list" size={14} /> {t("analytics.spendsHistory")}
        </button>
      }
      className="ct-insights-hub"
    >
      {sections}
    </PageShell>
  );
}
