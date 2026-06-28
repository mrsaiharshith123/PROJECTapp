import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import InsightCardContent from "../analytics/InsightCardContent.jsx";
import { getInsightBreakdownPath, getInsightCard } from "./insightSectionsConfig.js";

/**
 * One category block on the Insights hub — horizontal swipe through related cards.
 * @param {{ section: import('./insightSectionsConfig.js').INSIGHT_SECTIONS[number], data: object, initialCardId?: string | null }} props
 */
export default function InsightSectionCarousel({ section, data, initialCardId = null }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const cards = section.cards.map(getInsightCard).filter(Boolean);
  const initialIdx = Math.max(
    0,
    initialCardId ? cards.findIndex((c) => c.id === initialCardId) : 0,
  );
  const [activeIdx, setActiveIdx] = useState(initialIdx >= 0 ? initialIdx : 0);
  const [slideDir, setSlideDir] = useState("right");
  const touchStartX = useRef(null);

  if (cards.length === 0) return null;

  const goTo = (idx, dir = "right") => {
    if (idx === activeIdx || idx < 0 || idx >= cards.length) return;
    setSlideDir(dir);
    setActiveIdx(idx);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (dx < -40 && activeIdx < cards.length - 1) goTo(activeIdx + 1, "right");
    if (dx > 40 && activeIdx > 0) goTo(activeIdx - 1, "left");
  };

  const activeCard = cards[activeIdx];
  const enterClass = slideDir === "left" ? "ct-insight-card-enter-left" : "ct-insight-card-enter";
  const cardBreakdown = getInsightBreakdownPath(activeCard.id);
  const sectionBreakdown = section.breakdownPath;

  return (
    <section id={`insight-section-${section.id}`} className="ed-insight-section">
      <div className="ed-insight-section-head">
        <div className="ed-insight-section-kicker">{t(section.titleKey)}</div>
        {section.subtitleKey ? (
          <p className="ed-insight-section-sub">{t(section.subtitleKey)}</p>
        ) : null}
        {sectionBreakdown ? (
          <button
            type="button"
            className="ed-insight-breakdown"
            onClick={() => navigate(sectionBreakdown)}
          >
            {t("analytics.insightSectionBreakdown")}
          </button>
        ) : null}
      </div>

      {cards.length > 1 ? (
        <div className="ed-insight-pills">
          {cards.map((card, i) => (
            <button
              key={card.id}
              type="button"
              className={`ed-insight-pill ${i === activeIdx ? "active" : "inactive"}`}
              onClick={() => goTo(i, i > activeIdx ? "right" : "left")}
            >
              <CtIcon name={card.icon} size={11} />
              {t(card.labelKey)}
            </button>
          ))}
        </div>
      ) : null}

      <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div key={`${section.id}-${activeIdx}`} className={enterClass}>
          <InsightCardContent card={activeCard} data={data} showBreakdownCta />
        </div>
      </div>

      {cards.length > 1 ? (
        <div className="ed-insight-dots">
          {cards.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`ed-insight-dot ${i === activeIdx ? "active" : "inactive"}`}
              onClick={() => goTo(i, i > activeIdx ? "right" : "left")}
              aria-label={t("analytics.insightJumpAria", { n: i + 1 })}
            />
          ))}
        </div>
      ) : null}

      {cardBreakdown && !sectionBreakdown ? (
        <button
          type="button"
          className="ed-insight-breakdown"
          style={{ textAlign: "center", width: "100%", paddingBottom: 14 }}
          onClick={() => navigate(cardBreakdown)}
        >
          {t("analytics.insightCardBreakdown")}
        </button>
      ) : null}
    </section>
  );
}
