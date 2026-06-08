import { priorityRank } from "../constants/priority.js";

export function sortCommitments(list) {
  return [...list].sort((a, b) => {
    const pr = priorityRank(a.priority) - priorityRank(b.priority);
    if (pr !== 0) return pr;
    const da = a.dueDate || "";
    const db = b.dueDate || "";
    if (da !== db) return da.localeCompare(db);
    return String(a.name).localeCompare(String(b.name));
  });
}
