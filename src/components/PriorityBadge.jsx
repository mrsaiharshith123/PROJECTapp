import { getPriorityById } from "../constants/priority.js";

export default function PriorityBadge({ priorityId, className = "" }) {
  const p = getPriorityById(priorityId);
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${p.badgeClass} ${className}`}>
      {p.label}
    </span>
  );
}
