import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import InsightSectionCarousel from "./InsightSectionCarousel.jsx";
import { findSectionForCard, INSIGHT_SECTIONS } from "./insightSectionsConfig.js";

/** Main Insights hub — editorial chrome + stacked category carousels. */
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
    <div className="ct-page ed-insights-page">
      <div className="ed-insights-masthead">
        <div>
          <h1 className="ed-insights-masthead-title">{t("nav.insights")}</h1>
          <p className="ed-insights-masthead-sub">{t("analytics.hub.subtitle")}</p>
        </div>
        <button
          type="button"
          className="ed-byline-link"
          style={{ fontSize: 10, marginBottom: 2 }}
          onClick={() => navigate("/ledger/spends")}
        >
          {t("analytics.spendsHistory")}
        </button>
      </div>
      {sections}
    </div>
  );
}
