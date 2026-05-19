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
import { canEditLending } from "../engines/lendingAgreement.js";
import { mergeImportedAppState } from "../utils/dataImport.js";
import { refreshAllChitCommitments } from "../utils/chitSync.js";
import { reconcileBillAfterEdit } from "../utils/billPaymentProgress.js";
import {
  loadBusinessInvoicesFromStorage,
  normalizeBusinessInvoice,
  saveBusinessInvoicesToStorage,
} from "../utils/businessInvoices.js";

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
  const [commitments, setCommitments] = useState(() =>
    refreshAllChitCommitments(loadInitialAppState().commitments, todayYmd())
  );
  const [lendings, setLendings] = useState(() => loadInitialAppState().lendings);
  const [settings, setSettings] = useState(() => loadInitialAppState().settings);
  const [monthlySnapshots, setMonthlySnapshots] = useState(() => loadInitialAppState().monthlySnapshots);
  const [goals, setGoals] = useState(() => loadInitialAppState().goals);
  const [businessInvoicesAll, setBusinessInvoicesAll] = useState(() => loadBusinessInvoicesFromStorage());
  const [supplementalNotifications, setSupplementalNotifications] = useState([]);

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
      const raw = typeof updater === "function" ? updater(prev) : updater;
      const todayStr = todayYmd();
      const next = refreshAllChitCommitments(raw, todayStr);
      const normalized = next.map((c) =>
        normalizeCommitmentStatusForSave(normalizeCommitment(c), todayStr, next)
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

  const persistBusinessInvoices = useCallback((updater) => {
    setBusinessInvoicesAll((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const normalized = next.map((row) => normalizeBusinessInvoice(row));
      saveBusinessInvoicesToStorage(normalized);
      return normalized;
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
      persistCommitments((prev) => {
        const all = prev;
        return prev.map((c) => {
          if (String(c.id) !== String(id)) return c;
          const merged = reconcileBillAfterEdit(
            c,
            { ...c, ...patch, id: c.id, updatedAt: Date.now() },
            todayStr,
            all
          );
          return normalizeCommitmentStatusForSave(normalizeCommitment(merged), todayStr, all);
        });
      });
    },
    [persistCommitments, todayStr]
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
          let updated = applyPaymentToCommitment(c, payment, prev, todayStr);
          updated = normalizeCommitmentStatusForSave(normalizeCommitment(updated), todayStr, prev);
          if (Number(updated.remainingAmount) > 0) return [updated];
          const nextId = Date.now() + Math.floor(Math.random() * 1000);
          const { paidRow, nextCycle } = advanceRecurringCommitment(updated, nextId);
          return nextCycle ? [paidRow, nextCycle] : [paidRow];
        })
      );
    },
    [persistCommitments, todayStr]
  );

  const removeCommitmentPayment = useCallback(
    (id, paymentIndex) => {
      persistCommitments((prev) =>
        prev.map((c) => {
          if (String(c.id) !== String(id)) return c;
          const payments = [...(c.payments || [])];
          const idx = Number(paymentIndex);
          if (idx < 0 || idx >= payments.length) return c;
          payments.splice(idx, 1);
          const merged = normalizeCommitment({ ...c, payments, updatedAt: Date.now() });
          return normalizeCommitmentStatusForSave(merged, todayStr, prev);
        })
      );
    },
    [persistCommitments, todayStr]
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
        prev.map((l) => {
          if (String(l.id) !== String(id)) return l;
          if (!canEditLending(l)) return l;
          return normalizeLending({
            ...l,
            ...patch,
            id: l.id,
            updatedAt: Date.now(),
          });
        })
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
        if (patch.householdScope != null && patch.householdScope !== "family") {
          next.householdScope = "single";
        }
        if (patch.subscriptionTier != null && patch.subscriptionTier !== "power") {
          next.subscriptionTier = "free";
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

  const pushInAppNotification = useCallback((item) => {
    const row = {
      id: item.id || `local-${Date.now()}`,
      message: item.message || "",
      urgency: item.urgency || "normal",
      createdAt: Date.now(),
      read: false,
    };
    setSupplementalNotifications((prev) => [row, ...prev.filter((n) => n.id !== row.id)]);
    return row;
  }, []);

  const markNotificationRead = useCallback(
    (id) => {
      const sid = String(id);
      setSupplementalNotifications((prev) =>
        prev.map((n) => (n.id === sid ? { ...n, read: true } : n))
      );
      persistSettings((prev) => {
        const ids = new Set(prev.readNotificationIds || []);
        ids.add(sid);
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

  const addBusinessInvoice = useCallback(
    (raw) => {
      const now = Date.now();
      const row = normalizeBusinessInvoice({
        ...raw,
        id: raw.id ?? now,
        profileId: raw.profileId ?? settings.activeProfileId ?? "default",
        createdAt: now,
        updatedAt: now,
      });
      persistBusinessInvoices((prev) => [...prev, row]);
    },
    [persistBusinessInvoices, settings.activeProfileId]
  );

  const updateBusinessInvoice = useCallback(
    (id, patch) => {
      persistBusinessInvoices((prev) =>
        prev.map((row) =>
          String(row.id) !== String(id)
            ? row
            : normalizeBusinessInvoice({ ...row, ...patch, id: row.id, updatedAt: Date.now() })
        )
      );
    },
    [persistBusinessInvoices]
  );

  const deleteBusinessInvoice = useCallback(
    (id) => {
      persistBusinessInvoices((prev) => prev.filter((row) => String(row.id) !== String(id)));
    },
    [persistBusinessInvoices]
  );

  const markBusinessInvoicePaid = useCallback(
    (id) => {
      persistBusinessInvoices((prev) =>
        prev.map((row) =>
          String(row.id) !== String(id)
            ? row
            : normalizeBusinessInvoice({
                ...row,
                paid: true,
                paidAt: todayStr,
                updatedAt: Date.now(),
              })
        )
      );
    },
    [persistBusinessInvoices, todayStr]
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
  const profileGoals = useMemo(
    () => filterByProfile(goals, activeProfileId).filter((g) => g.active !== false && !g.archived),
    [goals, activeProfileId]
  );
  const businessInvoices = useMemo(
    () => filterByProfile(businessInvoicesAll, activeProfileId),
    [businessInvoicesAll, activeProfileId]
  );

  const importAppData = useCallback(
    (payload, options = {}) => {
      const merged = mergeImportedAppState(
        {
          commitments,
          lendings,
          goals,
          settings,
          monthlySnapshots,
        },
        payload,
        options
      );
      persistCommitments(() => merged.commitments);
      persistLendings(() => merged.lendings);
      persistGoals(() => merged.goals);
      persistSettings(() => merged.settings);
      if (merged.monthlySnapshots?.length) {
        persistSnapshots(() => merged.monthlySnapshots);
      }
      return merged.summary;
    },
    [
      commitments,
      lendings,
      goals,
      settings,
      monthlySnapshots,
      persistCommitments,
      persistLendings,
      persistGoals,
      persistSettings,
      persistSnapshots,
    ]
  );
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
      getEffectiveStatus: (c) => getEffectiveStatus(c, todayStr, commitments),
      getEffectiveLendingStatus: (l) => getEffectiveLendingStatus(l, todayStr),
      addCommitment,
      updateCommitment,
      deleteCommitment,
      addCommitmentPayment,
      removeCommitmentPayment,
      addLending,
      updateLending,
      deleteLending,
      addLendingPayment,
      updateSettings,
      addGoal,
      updateGoal,
      deleteGoal,
      supplementalNotifications,
      pushInAppNotification,
      markNotificationRead,
      markAllNotificationsRead,
      logSavingsToGoal,
      importAppData,
      businessInvoices,
      allBusinessInvoices: businessInvoicesAll,
      addBusinessInvoice,
      updateBusinessInvoice,
      deleteBusinessInvoice,
      markBusinessInvoicePaid,
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
      removeCommitmentPayment,
      addLending,
      updateLending,
      deleteLending,
      addLendingPayment,
      updateSettings,
      addGoal,
      updateGoal,
      deleteGoal,
      supplementalNotifications,
      pushInAppNotification,
      markNotificationRead,
      markAllNotificationsRead,
      logSavingsToGoal,
      importAppData,
      businessInvoices,
      businessInvoicesAll,
      addBusinessInvoice,
      updateBusinessInvoice,
      deleteBusinessInvoice,
      markBusinessInvoicePaid,
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
