import { useState } from "react";
import { explainInsight } from "../../guidance/index.js";
import { Caption, Body } from "../primitives/Text.jsx";

/**
 * Expandable “why am I seeing this?” for insights.
 * @param {{ insight: { id?: string, text?: string, tone?: string }, context?: object }} props
 */
export function WhyInsightPanel({ insight, context = {} }) {
  const [open, setOpen] = useState(false);
  if (!insight?.text) return null;

  const explained = explainInsight(insight, context);

  return (
    <div className="ct-guidance-why">
      <button type="button" className="ct-guidance-why-toggle" onClick={() => setOpen((v) => !v)}>
        {open ? "Hide explanation" : "Why is this shown?"}
      </button>
      {open && (
        <div className="ct-guidance-why-body">
          <Body className="!text-xs !font-medium">{explained.headline}</Body>
          <ul className="ct-guidance-why-list">
            {explained.reasons.map((r) => (
              <li key={r}>
                <Caption className="block">{r}</Caption>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default WhyInsightPanel;
