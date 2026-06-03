export function priorityBadgeTone(priorityId) {
  if (priorityId === "critical") return "danger";
  if (priorityId === "low") return "neutral";
  return "warning";
}
