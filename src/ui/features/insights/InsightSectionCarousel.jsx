import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import InsightCardContent from "../analytics/InsightCardContent.jsx";
import { INSIGHT_BORDERS } from "../analytics/insightCarouselConfig.js";
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
    <section id={`insight-section-${section.id}`} className="ct-insight-section" style={{ marginBottom: 28 }}>
      <div className="ct-row-between items-start" style={{ padding: "0 16px 10px" }}>
        <div className="min-w-0">
          <h2 className="ct-analytics-section-title" style={{ fontSize: 15, margin: 0 }}>
            {t(section.titleKey)}
          </h2>
          {section.subtitleKey ? (
            <p className="ct-analytics-section-sub" style={{ marginTop: 4, marginBottom: 0 }}>
              {t(section.subtitleKey)}
            </p>
          ) : null}
        </div>
        {sectionBreakdown ? (
          <button
            type="button"
            className="ct-btn ct-btn-ghost ct-btn-sm shrink-0"
            onClick={() => navigate(sectionBreakdown)}
          >
            {t("analytics.insightSectionBreakdown")}
          </button>
        ) : null}
      </div>

      {cards.length > 1 ? (
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "0 16px 10px",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {cards.map((card, i) => (
            <button
              key={card.id}
              type="button"
              onClick={() => goTo(i, i > activeIdx ? "right" : "left")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "5px 12px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 500,
                whiteSpace: "nowrap",
                cursor: "pointer",
                border:
                  i === activeIdx
                    ? `1px solid ${INSIGHT_BORDERS[card.accent]}`
                    : "0.5px solid rgba(255,255,255,0.08)",
                background: i === activeIdx ? `var(--pos-${card.accent}-bg)` : "rgba(255,255,255,0.04)",
                color: i === activeIdx ? `var(${card.accentVar})` : "var(--ct-text-muted)",
              }}
            >
              <CtIcon name={card.icon} size={11} />
              {t(card.labelKey)}
            </button>
          ))}
        </div>
      ) : null}

      <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={{ padding: "0 16px" }}>
        <div key={`${section.id}-${activeIdx}`} className={enterClass}>
          <InsightCardContent card={activeCard} data={data} showBreakdownCta />
        </div>
      </div>

      {cards.length > 1 ? (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "10px 0 0" }}>
          {cards.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i, i > activeIdx ? "right" : "left")}
              aria-label={t("analytics.insightJumpAria", { n: i + 1 })}
              style={{
                width: i === activeIdx ? 18 : 6,
                height: 6,
                borderRadius: 999,
                background: i === activeIdx ? `var(${activeCard.accentVar})` : "rgba(255,255,255,0.2)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "width 0.2s ease",
              }}
            />
          ))}
        </div>
      ) : null}

      {cardBreakdown && !sectionBreakdown ? (
        <div style={{ padding: "10px 16px 0", display: "flex", justifyContent: "center" }}>
          <button
            type="button"
            className="ct-btn ct-btn-ghost ct-btn-sm"
            onClick={() => navigate(cardBreakdown)}
          >
            {t("analytics.insightCardBreakdown")} <CtIcon name="caret-right" size={12} />
          </button>
        </div>
      ) : null}
    </section>
  );
}
