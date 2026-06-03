import { getPriorityById } from "../../constants/priority.js";
import { Badge } from "../primitives/Badge.jsx";
import { priorityBadgeTone } from "../tokens/priorityBadges.js";

export function PriorityBadge({ priorityId, className = "" }) {
  const p = getPriorityById(priorityId);
  return (
    <Badge tone={priorityBadgeTone(priorityId)} className={className}>
      {p.label}
    </Badge>
  );
}

export default PriorityBadge;
