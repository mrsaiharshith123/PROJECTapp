import { cn } from "../../../utils/cn.js";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { translateInsight } from "../../../../i18n/insightLabels.js";

const TONE_TILE = {
  info: "indigo",
  warning: "amber",
  critical: "danger",
  caution: "amber",
  positive: "teal",
  success: "teal",
};

/** Renders engine insight objects via i18n (`insight.{id}`). */
export default function ModeInsightStrip({ insights = [], max = 4 }) {
  const { t } = useTranslation();
  const list = insights.slice(0, max);
  if (!list.length) return null;
  return (
    <div className="ct-mode-insight-strip" role="list">
      {list.map((ins) => {
        const tone = ins.tone || "info";
        return (
          <div
            key={ins.id || ins.key || translateInsight(t, ins)}
            role="listitem"
            className={cn("ct-stat-tile text-xs leading-snug", TONE_TILE[tone] || "indigo")}
          >
            {translateInsight(t, ins)}
          </div>
        );
      })}
    </div>
  );
}
