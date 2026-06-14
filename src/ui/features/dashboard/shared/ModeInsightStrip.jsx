import { insightToneClass } from "../../../tokens/severity.js";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { translateInsight } from "../../../../i18n/insightLabels.js";

/** Renders engine insight objects via i18n (`insight.{id}`). */
export default function ModeInsightStrip({ insights = [], max = 4 }) {
  const { t } = useTranslation();
  const list = insights.slice(0, max);
  if (!list.length) return null;
  return (
    <ul className="ct-stack gap-2">
      {list.map((ins) => (
        <li
          key={ins.id || ins.key || translateInsight(t, ins)}
          className={`text-xs rounded-xl px-3 py-2 border ${insightToneClass(ins.tone || "info")}`}
        >
          {translateInsight(t, ins)}
        </li>
      ))}
    </ul>
  );
}
