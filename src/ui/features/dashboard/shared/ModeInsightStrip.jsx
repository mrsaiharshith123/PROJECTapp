import { insightToneClass } from "../../../tokens/severity.js";

/** Renders engine insight objects { text, tone }. */
export default function ModeInsightStrip({ insights = [], max = 4 }) {
  const list = insights.slice(0, max);
  if (!list.length) return null;
  return (
    <ul className="ct-stack gap-2">
      {list.map((ins) => (
        <li
          key={ins.id || ins.text}
          className={`text-xs rounded-xl px-3 py-2 border ${insightToneClass(ins.tone || "info")}`}
        >
          {ins.text}
        </li>
      ))}
    </ul>
  );
}
