import { useMemo } from "react";
import Fuse from "fuse.js";

function sortLendings(list) {
  return [...list].sort((a, b) => {
    const da = a.dueDate || "";
    const db = b.dueDate || "";
    if (da !== db) return da.localeCompare(db);
    return String(a.personName).localeCompare(String(b.personName));
  });
}

function filterBySearch(list, searchQuery) {
  const q = String(searchQuery || "").trim();
  if (!q) return list;
  const fuse = new Fuse(list, {
    keys: ["personName", "notes", "relationshipTag"],
    threshold: 0.4,
    minMatchCharLength: 2,
  });
  return fuse.search(q).map((r) => r.item);
}

export function useLendingLists(lendings, searchQuery = "") {
  const borrowedList = useMemo(
    () => sortLendings(filterBySearch(lendings.filter((l) => l.type === "borrowed"), searchQuery)),
    [lendings, searchQuery],
  );
  const lentList = useMemo(
    () => sortLendings(filterBySearch(lendings.filter((l) => l.type === "lent"), searchQuery)),
    [lendings, searchQuery],
  );
  const totals = useMemo(() => {
    let lentOut = 0;
    let borrowedIn = 0;
    let recovered = 0;
    let repaid = 0;
    let lentOutstanding = 0;
    let borrowedOutstanding = 0;
    for (const l of lendings) {
      const total = Number(l.totalAmount) || 0;
      const rem = Number(l.remainingAmount) || 0;
      const paid = total - rem;
      if (l.type === "lent") {
        lentOut += total;
        recovered += paid;
        lentOutstanding += rem;
      } else {
        borrowedIn += total;
        repaid += paid;
        borrowedOutstanding += rem;
      }
    }
    return { lentOut, borrowedIn, recovered, repaid, lentOutstanding, borrowedOutstanding };
  }, [lendings]);

  return { borrowedList, lentList, totals };
}
