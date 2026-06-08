import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { todayYmd } from "../utils/dates.js";
import { normalizeCommitmentStatusForSave } from "../utils/commitmentStatus.js";
import { emitLocalDataChanged, SETTINGS_RESET_EVENT } from "../storage/events.js";
import { useAuth } from "./AuthContext.jsx";
import { loadSubscriptionTier } from "../services/supabase/auth.js";
import {
  loadInitialAppState,
  loadSettingsFromStorage,
  invalidateInitialAppStateCache,
  saveMonthlySnapshotsToStorage,
  saveGoalsToStorage,
  saveDailySpendsToStorage,
  normalizeCommitment,
  normalizeLending,
  SCHEMA_VERSION_KEY,
  CURRENT_SCHEMA_VERSION,
} from "../utils/migrateStorage.js";
import { getEffectiveLendingStatus } from "../utils/lendingStatus.js";
import { filterByProfile } from "../utils/profileScope.js";
import { getEffectiveStatus } from "../utils/commitmentStatus.js";
import { buildMonthlySnapshot } from "../engines/snapshots.js";
import { mergeImportedAppState } from "../utils/dataImport.js";
import { refreshAllChitCommitments } from "../utils/chitSync.js";
import {
  registerDevSubscriptionTools,
  unregisterDevSubscriptionTools,
} from "../utils/devSubscriptionTools.js";
import { filterDailySpendsByProfile } from "../utils/dailySpends.js";
import { sortCommitments } from "./commitTrackSort.js";
import { useCommitTrackCrud } from "./useCommitTrackCrud.js";

/** @type {import('react').Context<import('../types/context.js').CommitTrackContextValue | null>} */
const CommitTrackContext = createContext(/** @type {import('../types/context.js').CommitTrackContextValue | null} */ (null));

export function CommitTrackProvider({ children }) {
  const { user } = useAuth();
  const [commitments, setCommitments] = useState(() =>
    refreshAllChitCommitments(loadInitialAppState().commitments, todayYmd())
  );
  const [lendings, setLendings] = useState(() => loadInitialAppState().lendings);
  const [settings, setSettings] = useState(() => loadInitialAppState().settings);
  const [monthlySnapshots, setMonthlySnapshots] = useState(() => loadInitialAppState().monthlySnapshots);
  const [goals, setGoals] = useState(() => loadInitialAppState().goals);
  const [dailySpends, setDailySpends] = useState(() => loadInitialAppState().dailySpends);
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

  useEffect(() => {
    const onSettingsReset = () => setSettings(loadSettingsFromStorage());
    window.addEventListener(SETTINGS_RESET_EVENT, onSettingsReset);
    return () => window.removeEventListener(SETTINGS_RESET_EVENT, onSettingsReset);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    loadSubscriptionTier(user.id)
      .then((tier) => {
        setSettings((prev) => {
          if (tier === (prev.subscriptionTier || "free")) return prev;
          const next = { ...prev, subscriptionTier: tier };
          try {
            localStorage.setItem("committrack_settings", JSON.stringify(next));
            invalidateInitialAppStateCache();
          } catch {
            /* ignore */
          }
          return next;
        });
      })
      .catch(() => {});
  }, [user?.id]);

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
        invalidateInitialAppStateCache();
        emitLocalDataChanged();
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
        invalidateInitialAppStateCache();
        emitLocalDataChanged();
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
        invalidateInitialAppStateCache();
        emitLocalDataChanged();
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
      invalidateInitialAppStateCache();
      emitLocalDataChanged();
      return next;
    });
  }, []);

  const persistGoals = useCallback((updater) => {
    setGoals((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveGoalsToStorage(next);
      invalidateInitialAppStateCache();
      emitLocalDataChanged();
      return next;
    });
  }, []);

  const persistDailySpends = useCallback((updater) => {
    setDailySpends((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveDailySpendsToStorage(next);
      invalidateInitialAppStateCache();
      emitLocalDataChanged();
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

  const crud = useCommitTrackCrud({
    commitments,
    settings,
    todayStr,
    persistCommitments,
    persistLendings,
    persistSettings,
    persistGoals,
    persistDailySpends,
    setSupplementalNotifications,
  });

  const { updateSettings } = crud;

  useEffect(() => {
    registerDevSubscriptionTools({ updateSettings, userId: user?.id ?? null });
    return () => unregisterDevSubscriptionTools();
  }, [updateSettings, user?.id]);

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
  const profileDailySpends = useMemo(
    () => filterDailySpendsByProfile(dailySpends, activeProfileId),
    [dailySpends, activeProfileId]
  );
  const importAppData = useCallback(
    (payload, options = {}) => {
      const merged = mergeImportedAppState(
        {
          commitments,
          lendings,
          goals,
          dailySpends,
          settings,
          monthlySnapshots,
        },
        payload,
        options
      );
      persistCommitments(() => merged.commitments);
      persistLendings(() => merged.lendings);
      persistGoals(() => merged.goals);
      persistDailySpends(() => merged.dailySpends);
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
      dailySpends,
      settings,
      monthlySnapshots,
      persistCommitments,
      persistLendings,
      persistGoals,
      persistDailySpends,
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
      dailySpends: profileDailySpends,
      allDailySpends: dailySpends,
      activeProfileId,
      settings,
      monthlySnapshots,
      todayStr,
      getEffectiveStatus: (c) => getEffectiveStatus(c, todayStr, commitments),
      getEffectiveLendingStatus: (l) => getEffectiveLendingStatus(l, todayStr),
      ...crud,
      supplementalNotifications,
      importAppData,
    }),
    [
      profileCommitments,
      commitments,
      sortedCommitments,
      profileLendings,
      lendings,
      profileGoals,
      goals,
      dailySpends,
      profileDailySpends,
      activeProfileId,
      settings,
      monthlySnapshots,
      todayStr,
      crud,
      supplementalNotifications,
      importAppData,
    ]
  );

  return <CommitTrackContext.Provider value={value}>{children}</CommitTrackContext.Provider>;
}

export function useCommitTrack() {
  const ctx = useContext(CommitTrackContext);
  if (!ctx) throw new Error("useCommitTrack must be used within CommitTrackProvider");
  return ctx;
}
