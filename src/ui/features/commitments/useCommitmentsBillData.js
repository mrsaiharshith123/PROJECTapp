import { useMemo } from "react";
import Fuse from "fuse.js";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { isActiveBill, isHistoryBill } from "../../../utils/billLifecycle.js";
import { monthlyBurdenForCommitment } from "../../../engines/burden.js";
import { priorityRank } from "../../../constants/priority.js";

export function useCommitmentsBillData({
  sortedCommitments,
  getEffectiveStatus,
  todayStr,
  search,
  filterCategory,
  filterStatus,
  filterPriority,
  filterPreset,
  sortBy,
}) {
  const withEffective = useMemo(
    () =>
      sortedCommitments.map((c) => ({
        ...c,
        effectiveStatus: getEffectiveStatus(c),
      })),
    [sortedCommitments, getEffectiveStatus]
  );

  const searchMatched = useMemo(() => {
    const q = String(search || "").trim();
    if (!q) return null;
    const fuse = new Fuse(withEffective, {
      keys: ["name", "category", "notes"],
      threshold: 0.4,
      minMatchCharLength: 2,
    });
    return new Set(fuse.search(q).map((r) => r.item.id));
  }, [withEffective, search]);

  const filtered = useMemo(() => {
    let list = withEffective.filter((item) => {
      if (searchMatched && !searchMatched.has(item.id)) return false;
      if (filterCategory && item.category !== filterCategory) return false;
      if (filterStatus && item.effectiveStatus !== filterStatus) return false;
      if (filterPriority && item.priority !== filterPriority) return false;
      return true;
    });

    if (filterPreset === "recurring") {
      list = list.filter((i) => i.repeatType && i.repeatType !== "none");
    } else if (filterPreset === "subscriptions") {
      list = list.filter((i) => i.category === "Subscription");
    } else if (filterPreset === "loans_emi") {
      list = list.filter((i) => i.category === "EMI" || i.category === "Loan");
    } else if (filterPreset === "overdue_only") {
      list = list.filter((i) => i.effectiveStatus === "overdue");
    } else if (filterPreset === "upcoming") {
      list = list.filter((i) => {
        if (i.effectiveStatus !== "pending" || !i.dueDate) return false;
        try {
          const d = differenceInCalendarDays(
            parseISO(`${i.dueDate}T12:00:00`),
            parseISO(`${todayStr}T12:00:00`)
          );
          return d >= 0 && d <= 14;
        } catch {
          return false;
        }
      });
    } else if (filterPreset === "high_remaining") {
      list = list.filter((i) => Number(i.amount ?? i.remainingAmount ?? 0) >= 15000);
    } else if (filterPreset === "high_pressure" && list.length) {
      const burdens = list
        .map((i) => monthlyBurdenForCommitment(i, getEffectiveStatus))
        .sort((a, b) => a - b);
      const med = burdens[Math.floor(burdens.length / 2)] ?? 0;
      list = list.filter((i) => monthlyBurdenForCommitment(i, getEffectiveStatus) >= med);
    }

    const burden = (i) => monthlyBurdenForCommitment(i, getEffectiveStatus);
    const rem = (i) => Number(i.remainingAmount ?? 0);
    const sorted = [...list];
    if (sortBy === "due_soonest") {
      sorted.sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
    } else if (sortBy === "burden_desc") {
      sorted.sort((a, b) => burden(b) - burden(a));
    } else if (sortBy === "remaining_desc") {
      sorted.sort((a, b) => rem(b) - rem(a));
    } else if (sortBy === "priority") {
      sorted.sort((a, b) => {
        const d = priorityRank(a.priority) - priorityRank(b.priority);
        if (d !== 0) return d;
        return (a.dueDate || "").localeCompare(b.dueDate || "");
      });
    } else {
      sorted.sort((a, b) => {
        const d = priorityRank(a.priority) - priorityRank(b.priority);
        if (d !== 0) return d;
        return (a.dueDate || "").localeCompare(b.dueDate || "");
      });
    }

    return sorted;
  }, [
    withEffective,
    searchMatched,
    filterCategory,
    filterStatus,
    filterPriority,
    filterPreset,
    sortBy,
    getEffectiveStatus,
    todayStr,
  ]);

  const activeBills = useMemo(
    () => filtered.filter((c) => isActiveBill(c, getEffectiveStatus, todayStr)),
    [filtered, getEffectiveStatus, todayStr]
  );

  const historyBills = useMemo(() => {
    let list = withEffective.filter((c) => isHistoryBill(c, getEffectiveStatus, todayStr));
    if (searchMatched) list = list.filter((i) => searchMatched.has(i.id));
    if (filterCategory) list = list.filter((i) => i.category === filterCategory);
    return list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }, [withEffective, searchMatched, filterCategory, getEffectiveStatus, todayStr]);

  const counts = useMemo(() => {
    return withEffective.filter((c) => isActiveBill(c, getEffectiveStatus, todayStr)).reduce(
      (acc, c) => {
        acc[c.effectiveStatus] = (acc[c.effectiveStatus] || 0) + 1;
        return acc;
      },
      { paid: 0, pending: 0, overdue: 0, upnext: 0 }
    );
  }, [withEffective, getEffectiveStatus, todayStr]);

  return { activeBills, historyBills, counts };
}
