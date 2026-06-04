import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Caption } from "../../index.js";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { ConceptHelp } from "../../guidance/ConceptHelp.jsx";

function healthTone(level) {
  if (level === "excellent") return "success";
  if (level === "good") return "neutral";
  if (level === "caution") return "warning";
  return "danger";
}

export default function FinancialHealthTile() {
  const navigate = useNavigate();
  const intel = useCommitIntel();
  const health = intel.health;

  const hint = useMemo(() => {
    if (!health) return "";
    if (health.level === "excellent") return "Strong month — keep your buffer growing.";
    if (health.level === "good") return "On track — watch overdue items.";
    if (health.level === "caution") return "Tight — review top bills.";
    return "High pressure — prioritize essentials.";
  }, [health]);

  if (!health) return null;

  return (
    <button
      type="button"
      className="ct-health-strip"
      onClick={() => navigate("/analytics")}
      aria-label={`Financial health ${health.score}, ${health.label}. Open analytics.`}
    >
      <div className="ct-health-strip-main min-w-0">
        <span className="ct-metric-label inline-flex items-center gap-0.5">
          Financial health
          <ConceptHelp conceptId="healthScore" />
        </span>
        <span className="ct-health-strip-score">{health.score}</span>
      </div>
      <div className="ct-health-strip-side shrink-0 text-right">
        <Badge tone={healthTone(health.level)}>{health.label}</Badge>
        <Caption className="block mt-1 max-w-[11rem]">{hint}</Caption>
      </div>
    </button>
  );
}
