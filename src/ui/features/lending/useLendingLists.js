import { useMemo } from "react";
import { lendingTrustByPerson, trustScoreForLendingEntry } from "../../../engines/lendingTrust.js";

function sortLendings(list) {
  return [...list].sort((a, b) => {
    const da = a.dueDate || "";
    const db = b.dueDate || "";
    if (da !== db) return da.localeCompare(db);
    return String(a.personName).localeCompare(String(b.personName));
  });
}

export function useLendingLists(lendings) {
  const borrowedList = useMemo(() => sortLendings(lendings.filter((l) => l.type === "borrowed")), [lendings]);
  const lentList = useMemo(() => sortLendings(lendings.filter((l) => l.type === "lent")), [lendings]);
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

  return { borrowedList, lentList, trustRows, totals, trustScore };
}
