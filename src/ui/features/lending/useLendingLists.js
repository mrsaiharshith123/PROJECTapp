import { useMemo } from "react";
import Fuse from "fuse.js";
import { lendingTrustByPerson, trustScoreForLendingEntry } from "../../../engines/lendingTrust.js";

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
  const trustRows = useMemo(() => lendingTrustByPerson(lendings), [lendings]);

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

  const trustScore = useMemo(() => {
    if (!lendings?.length) return null;
    const scores = lendings.map((l) => trustScoreForLendingEntry(l, lendings));
    return Math.round(scores.reduce((sum, n) => sum + n, 0) / scores.length);
  }, [lendings]);

  /** Per-entry trust scores — compute once per lendings change (avoid O(n²) per card). */
  const trustByEntryId = useMemo(() => {
    const map = new Map();
    for (const l of lendings) {
      map.set(l.id, trustScoreForLendingEntry(l, lendings));
    }
    return map;
  }, [lendings]);

  return { borrowedList, lentList, trustRows, totals, trustScore, trustByEntryId };
}
