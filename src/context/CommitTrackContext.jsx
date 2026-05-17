import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { todayYmd } from "../utils/dates.js";
import { normalizeCommitmentStatusForSave } from "../utils/commitmentStatus.js";
import { applyPaymentToCommitment } from "../utils/commitmentPayments.js";
import { advanceRecurringCommitment } from "../utils/commitmentRecurring.js";
import {
  loadInitialAppState,
  saveMonthlySnapshotsToStorage,
  saveGoalsToStorage,
  normalizeCommitment,
  normalizeLending,
  normalizeGoal,
  SCHEMA_VERSION_KEY,
  CURRENT_SCHEMA_VERSION,
} from "../utils/migrateStorage.js";
import { applyPaymentToLending, getEffectiveLendingStatus } from "../utils/lendingStatus.js";
import { filterByProfile } from "../utils/profileScope.js";
import { priorityRank } from "../constants/priority.js";
import { USER_MODE_IDS } from "../constants/userModes.js";
import { getEffectiveStatus } from "../utils/commitmentStatus.js";
import { buildMonthlySnapshot } from "../engines/snapshots.js";

const CommitTrackContext = createContext(null);

function sortCommitments(list) {
  return [...list].sort((a, b) => {
    const pr = priorityRank(a.priority) - priorityRank(b.priority);
    if (pr !== 0) return pr;
    const da = a.dueDate || "";
    const db = b.dueDate || "";
    if (da !== db) return da.localeCompare(db);
    return String(a.name).localeCompare(String(b.name));
  });
}

export function CommitTrackProvider({ children }) {
  const [commitments, setCommitments] = useState(() => loadInitialAppState().commitments);
  const [lendings, setLendings] = useState(() => loadInitialAppState().lendings);
  const [settings, setSettings] = useState(() => loadInitialAppState().settings);
  const [monthlySnapshots, setMonthlySnapshots] = useState(() => loadInitialAppState().monthlySnapshots);
  const [goals, setGoals] = useState(() => loadInitialAppState().goals);

  useEffect(() => {
    try {
      const v = localStorage.getItem(SCHEMA_VERSION_KEY);
      if (Number(v) < CURRENT_SCHEMA_VERSION) {
        localStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persistCommitments = useCallback((updater) => {
    setCommitments((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const todayStr = todayYmd();
      const normalized = next.map((c) =>
        normalizeCommitmentStatusForSave(normalizeCommitment(c), todayStr)
      );
      try {
        localStorage.setItem("commitments", JSON.stringify(normalized));
      } catch {
        /* ignore */
      }
      return normalized;
    });
  }, []);

  const persistLendings = useCallback((updater) => {
    setLendings((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const normalized = next.map((l) => normalizeLending(l));
      try {
        localStorage.setItem("lendings", JSON.stringify(normalized));
      } catch {
        /* ignore */
      }
      return normalized;
    });
  }, []);

  const persistSettings = useCallback((updater) => {
    setSettings((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try {
        localStorage.setItem("committrack_settings", JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const persistSnapshots = useCallback((updater) => {
    setMonthlySnapshots((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveMonthlySnapshotsToStorage(next);
      return next;
    });
  }, []);

  const persistGoals = useCallback((updater) => {
    setGoals((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveGoalsToStorage(next);
      return next;
    });
  }, []);

  const todayStr = todayYmd();

  useEffect(() => {
    const monthKey = format(new Date(), "yyyy-MM");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- append at most one snapshot per calendar month
    persistSnapshots((prev) => {
      if (prev.some((s) => s.month === monthKey)) return prev;
      const scoped = filterByProfile(commitments, settings.activeProfileId || "default");
      const snap = buildMonthlySnapshot(
        monthKey,
        scoped,
        settings.monthlyIncome,
        (c) => getEffectiveStatus(c, todayStr),
        prev
      );
      return [...prev, snap].sort((a, b) => a.month.localeCompare(b.month)).slice(-48);
    });
  }, [commitments, settings.monthlyIncome, settings.activeProfileId, todayStr, persistSnapshots]);

  const addCommitment = useCallback(
    (raw) => {
      const now = Date.now();
      const c = normalizeCommitment({
        ...raw,
        id: raw.id ?? now,
        profileId: raw.profileId ?? settings.activeProfileId ?? "default",
        createdAt: now,
        updatedAt: now,
      });
      persistCommitments((prev) => [...prev, c]);
    },
    [persistCommitments, settings.activeProfileId]
  );

  const updateCommitment = useCallback(
    (id, patch) => {
      persistCommitments((prev) =>
        prev.map((c) =>
          String(c.id) !== String(id)
            ? c
            : normalizeCommitment({
                ...c,
                ...patch,
                id: c.id,
                updatedAt: Date.now(),
              })
        )
      );
    },
    [persistCommitments]
  );

  const deleteCommitment = useCallback(
    (id) => {
      persistCommitments((prev) => prev.filter((c) => String(c.id) !== String(id)));
    },
    [persistCommitments]
  );

  const addCommitmentPayment = useCallback(
    (id, payment) => {
      persistCommitments((prev) =>
        prev.flatMap((c) => {
          if (String(c.id) !== String(id)) return [c];
          const updated = applyPaymentToCommitment(c, payment);
          if (Number(updated.remainingAmount) > 0) return [updated];
          const nextId = Date.now() + Math.floor(Math.random() * 1000);
          const { paidRow, nextCycle } = advanceRecurringCommitment(updated, nextId);
          return nextCycle ? [paidRow, nextCycle] : [paidRow];
        })
      );
    },
    [persistCommitments]
  );

  const addLending = useCallback(
    (raw) => {
      const now = Date.now();
      const total = Math.max(0, Number(raw.totalAmount) || 0);
      const l = normalizeLending({
        ...raw,
        id: raw.id ?? now,
        profileId: raw.profileId ?? settings.activeProfileId ?? "default",
        createdAt: now,
        updatedAt: now,
        totalAmount: total,
        payments: [],
        remainingAmount: total,
        status: "pending",
      });
      persistLendings((prev) => [...prev, l]);
    },
    [persistLendings, settings.activeProfileId]
  );

  const updateLending = useCallback(
    (id, patch) => {
      persistLendings((prev) =>
        prev.map((l) =>
          String(l.id) !== String(id)
            ? l
            : normalizeLending({
                ...l,
                ...patch,
                id: l.id,
                updatedAt: Date.now(),
              })
        )
      );
    },
    [persistLendings]
  );

  const deleteLending = useCallback(
    (id) => {
      persistLendings((prev) => {
        const row = prev.find((l) => String(l.id) === String(id));
        if (row?.agreementLocked) {
          const rem = Number(row.remainingAmount) || 0;
          const settled = rem <= 0 || row.status === "complete";
          const mutual =
            Boolean(row.mutualCancelBorrowerSign?.trim()) &&
            Boolean(row.mutualCancelLenderSign?.trim());
          if (!settled && !mutual) return prev;
        }
        return prev.filter((l) => String(l.id) !== String(id));
      });
    },
    [persistLendings]
  );

  const addLendingPayment = useCallback(
    (id, payment) => {
      persistLendings((prev) =>
        prev.map((l) => (String(l.id) !== String(id) ? l : applyPaymentToLending(l, payment, todayStr)))
      );
    },
    [persistLendings, todayStr]
  );

  const updateSettings = useCallback(
    (patch) => {
      persistSettings((prev) => {
        const next = { ...prev, ...patch };
        if (patch.userMode != null && !USER_MODE_IDS.includes(patch.userMode)) {
          next.userMode = prev.userMode || "salaried";
        }
        return next;
      });
    },
    [persistSettings]
  );

  const addGoal = useCallback(
    (raw) => {
      const scoped = filterByProfile(commitments, settings.activeProfileId || "default");
      const openSumScoped = scoped.reduce((s, c) => {
        if (getEffectiveStatus(c, todayStr) === "paid") return s;
        return s + Math.max(0, Number(c.remainingAmount ?? 0));
      }, 0);
      const g = normalizeGoal({
        ...raw,
        id: raw.id ?? Date.now(),
        profileId: raw.profileId ?? settings.activeProfileId ?? "default",
        baselineOpenRemaining: raw.baselineOpenRemaining ?? openSumScoped,
      });
      persistGoals((prev) => [...prev, g]);
    },
    [commitments, settings.activeProfileId, persistGoals, todayStr]
  );

  const updateGoal = useCallback(
    (id, patch) => {
      persistGoals((prev) =>
        prev.map((g) =>
          String(g.id) !== String(id)
            ? g
            : normalizeGoal({
                ...g,
                ...patch,
                id: g.id,
                updatedAt: Date.now(),
              })
        )
      );
    },
    [persistGoals]
  );

  const deleteGoal = useCallback(
    (id) => {
      persistGoals((prev) => prev.filter((g) => String(g.id) !== String(id)));
    },
    [persistGoals]
  );

  const markNotificationRead = useCallback(
    (id) => {
      persistSettings((prev) => {
        const ids = new Set(prev.readNotificationIds || []);
        ids.add(String(id));
        return { ...prev, readNotificationIds: [...ids] };
      });
    },
    [persistSettings]
  );

  const markAllNotificationsRead = useCallback(
    (ids) => {
      persistSettings((prev) => {
        const set = new Set([...(prev.readNotificationIds || []), ...ids.map(String)]);
        return { ...prev, readNotificationIds: [...set] };
      });
    },
    [persistSettings]
  );

  const logSavingsToGoal = useCallback(
    (goalId, amount) => {
      const amt = Math.max(0, Number(amount) || 0);
      if (amt <= 0) return;
      persistGoals((prev) =>
        prev.map((g) =>
          String(g.id) !== String(goalId)
            ? g
            : normalizeGoal({
                ...g,
                savedAmount: Math.max(0, Number(g.savedAmount) || 0) + amt,
                updatedAt: Date.now(),
              })
        )
      );
    },
    [persistGoals]
  );

  const activeProfileId = settings.activeProfileId || "default";

  const profileCommitments = useMemo(
    () => filterByProfile(commitments, activeProfileId),
    [commitments, activeProfileId]
  );
  const profileLendings = useMemo(
    () => filterByProfile(lendings, activeProfileId),
    [lendings, activeProfileId]
  );
  const profileGoals = useMemo(() => filterByProfile(goals, activeProfileId), [goals, activeProfileId]);
  const sortedCommitments = useMemo(() => sortCommitments(profileCommitments), [profileCommitments]);
  const value = useMemo(
    () => ({
      commitments: profileCommitments,
      allCommitments: commitments,
      sortedCommitments,
      lendings: profileLendings,
      allLendings: lendings,
      goals: profileGoals,
      allGoals: goals,
      activeProfileId,
      settings,
      monthlySnapshots,
      todayStr,
      getEffectiveStatus: (c) => getEffectiveStatus(c, todayStr),
      getEffectiveLendingStatus: (l) => getEffectiveLendingStatus(l, todayStr),
      addCommitment,
      updateCommitment,
      deleteCommitment,
      addCommitmentPayment,
      addLending,
      updateLending,
      deleteLending,
      addLendingPayment,
      updateSettings,
      addGoal,
      updateGoal,
      deleteGoal,
      markNotificationRead,
      markAllNotificationsRead,
      logSavingsToGoal,
    }),
    [
      profileCommitments,
      commitments,
      sortedCommitments,
      profileLendings,
      lendings,
      profileGoals,
      goals,
      activeProfileId,
      settings,
      monthlySnapshots,
      todayStr,
      addCommitment,
      updateCommitment,
      deleteCommitment,
      addCommitmentPayment,
      addLending,
      updateLending,
      deleteLending,
      addLendingPayment,
      updateSettings,
      addGoal,
      updateGoal,
      deleteGoal,
      markNotificationRead,
      markAllNotificationsRead,
      logSavingsToGoal,
    ]
  );

  return <CommitTrackContext.Provider value={value}>{children}</CommitTrackContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCommitTrack() {
  const ctx = useContext(CommitTrackContext);
  if (!ctx) throw new Error("useCommitTrack must be used within CommitTrackProvider");
  return ctx;
}
