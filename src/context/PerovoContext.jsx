import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { todayYmd } from "../utils/dates.js";
import { normalizeCommitmentStatusForSave } from "../utils/commitmentStatus.js";
import { emitLocalDataChanged, SETTINGS_RESET_EVENT } from "../storage/events.js";
import { useAuth } from "./AuthContext.jsx";
import { loadSubscriptionTier, syncSettingsToServer, loadSettingsFromServer } from "../services/supabase/auth.js";
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
import { loadWealthState, saveWealthState } from "../utils/netWorth/wealthStorage.js";
import { mergeAccountSettingsFromServer } from "../utils/accountSettingsSync.js";
import { saveSyncMeta } from "../services/sync/syncMeta.js";
import { refreshAllChitCommitments } from "../utils/chitSync.js";
import {
  registerDevSubscriptionTools,
  unregisterDevSubscriptionTools,
} from "../utils/devSubscriptionTools.js";
import { filterDailySpendsByProfile } from "../utils/dailySpends.js";
import { sortCommitments } from "./perovoSort.js";
import { usePerovoCrud } from "./usePerovoCrud.js";
import { fetchFundNav } from "../services/market/amfiNav.js";
import {
  fetchGoldPricePerGram,
  isGoldApiConfigured,
  shouldRefreshGoldRate,
} from "../services/market/goldPrice.js";
import { applyGoldRateToWealth } from "../utils/netWorth/goldRateSync.js";

/** @type {import('react').Context<import('../types/context.js').PerovoContextValue | null>} */
const PerovoContext = createContext(/** @type {import('../types/context.js').PerovoContextValue | null} */ (null));

export function PerovoProvider({ children }) {
  const { user } = useAuth();
  const syncTimerRef = useRef(null);
  const userIdRef = useRef(user?.id);
  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);
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
    let cancelled = false;
    (async () => {
      const local = loadSettingsFromStorage();
      let serverSettings = null;
      try {
        serverSettings = await loadSettingsFromServer();
      } catch {
        /* ignore */
      }
      if (cancelled) return;

      const merged = serverSettings
        ? mergeAccountSettingsFromServer(local, serverSettings)
        : local;

      if (serverSettings && merged !== local) {
        try {
          localStorage.setItem("perovo_settings", JSON.stringify(merged));
          invalidateInitialAppStateCache();
        } catch {
          /* ignore */
        }
        setSettings(merged);
      }

      await syncSettingsToServer(merged).catch(() => {});
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    loadSubscriptionTier(user.id)
      .then((tier) => {
        setSettings((prev) => {
          if (tier === (prev.subscriptionTier || "free")) return prev;
          const next = { ...prev, subscriptionTier: tier };
          try {
            localStorage.setItem("perovo_settings", JSON.stringify(next));
            invalidateInitialAppStateCache();
          } catch {
            /* ignore */
          }
          return next;
        });
      })
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    return () => clearTimeout(syncTimerRef.current);
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
      const merged = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      if (merged === prev) return prev;
      const next = { ...merged, updatedAt: new Date().toISOString() };
      try {
        localStorage.setItem("perovo_settings", JSON.stringify(next));
        invalidateInitialAppStateCache();
        emitLocalDataChanged();
        if ("cloudSyncEnabled" in merged && merged.cloudSyncEnabled !== prev.cloudSyncEnabled) {
          saveSyncMeta({ cloudBackupEnabled: Boolean(merged.cloudSyncEnabled) });
        }
        clearTimeout(syncTimerRef.current);
        if (userIdRef.current) {
          syncTimerRef.current = setTimeout(() => {
            syncSettingsToServer(next);
          }, 2000);
        }
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

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const todayStr = todayYmd();

  useEffect(() => {
    const monthKey = format(new Date(), "yyyy-MM");
    const s = settingsRef.current;
    persistSnapshots((prev) => {
      if (prev.some((snap) => snap.month === monthKey)) return prev;
      const scoped = filterByProfile(commitments, s.activeProfileId || "default");
      const snap = buildMonthlySnapshot(
        monthKey,
        scoped,
        s.monthlyIncome,
        (c) => getEffectiveStatus(c, todayStr),
        prev
      );
      return [...prev, snap].sort((a, b) => a.month.localeCompare(b.month)).slice(-48);
    });
  }, [commitments, todayStr, persistSnapshots]);

  const crud = usePerovoCrud({
    commitments,
    settings,
    todayStr,
    userId: user?.id,
    persistCommitments,
    persistLendings,
    persistSettings,
    persistGoals,
    persistDailySpends,
    setSupplementalNotifications,
  });

  const { updateSettings, updateCommitment } = crud;
  const updateCommitmentRef = useRef(updateCommitment);
  useEffect(() => {
    updateCommitmentRef.current = updateCommitment;
  }, [updateCommitment]);

  useEffect(() => {
    registerDevSubscriptionTools({ updateSettings, userId: user?.id ?? null });
    return () => unregisterDevSubscriptionTools();
  }, [updateSettings, user?.id]);

  const refreshGoldRate = useCallback(async (options = {}) => {
    const force = Boolean(options.force);
    if (!isGoldApiConfigured()) return false;
    const s = settingsRef.current;
    if (
      !force &&
      !shouldRefreshGoldRate(s.goldRateLastFetched, s.goldRatePerGram)
    ) {
      return Number(s.goldRatePerGram) > 0;
    }
    const result = await fetchGoldPricePerGram();
    if (!result) return false;
    persistSettings((prev) => ({
      ...prev,
      goldRatePerGram: result.perGram,
      goldRateLastFetched: result.date,
    }));
    applyGoldRateToWealth(result.perGram);
    return true;
  }, [persistSettings]);

  useEffect(() => {
    if (!isGoldApiConfigured()) return;
    refreshGoldRate();
  }, [refreshGoldRate]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const s = settingsRef.current;
      if (!shouldRefreshGoldRate(s.goldRateLastFetched, s.goldRatePerGram)) return;
      refreshGoldRate();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshGoldRate]);

  const commitmentsRef = useRef(commitments);
  useEffect(() => {
    commitmentsRef.current = commitments;
  }, [commitments]);

  const navStaleSig = useMemo(
    () =>
      commitments
        .filter((c) => {
          if (!c.schemeCode) return false;
          const fetched = c.navFetchedAt ? String(c.navFetchedAt).slice(0, 10) : "";
          return fetched !== todayStr;
        })
        .map((c) => String(c.id))
        .sort()
        .join(","),
    [commitments, todayStr],
  );

  const navRefreshRef = useRef({ sig: "", inFlight: false });

  useEffect(() => {
    if (!navStaleSig) {
      navRefreshRef.current = { sig: "", inFlight: false };
      return;
    }
    if (navRefreshRef.current.inFlight && navRefreshRef.current.sig === navStaleSig) return;

    navRefreshRef.current = { sig: navStaleSig, inFlight: true };
    let cancelled = false;
    const ids = navStaleSig.split(",").filter(Boolean);

    (async () => {
      try {
        for (const id of ids) {
          const c = commitmentsRef.current.find((row) => String(row.id) === id);
          if (!c?.schemeCode) continue;
          const fetched = c.navFetchedAt ? String(c.navFetchedAt).slice(0, 10) : "";
          if (fetched === todayStr) continue;
          const nav = await fetchFundNav(c.schemeCode);
          if (cancelled || !nav) continue;
          updateCommitmentRef.current(c.id, { currentNav: nav.nav, navFetchedAt: todayStr });
        }
      } finally {
        if (!cancelled) navRefreshRef.current.inFlight = false;
      }
    })();

    return () => {
      cancelled = true;
      navRefreshRef.current.inFlight = false;
    };
  }, [navStaleSig, todayStr]);

  const getEffectiveStatusForCtx = useCallback(
    (c) => getEffectiveStatus(c, todayStr, commitmentsRef.current),
    [todayStr],
  );

  const getEffectiveLendingStatusForCtx = useCallback(
    (l) => getEffectiveLendingStatus(l, todayStr),
    [todayStr],
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
  const profileDailySpends = useMemo(
    () => filterDailySpendsByProfile(dailySpends, activeProfileId),
    [dailySpends, activeProfileId]
  );
  const importAppData = useCallback(
    (payload, options = {}) => {
      const merged = mergeImportedAppState(
        {
          commitments: commitmentsRef.current,
          lendings,
          goals,
          dailySpends,
          settings: settingsRef.current,
          monthlySnapshots,
          wealth: loadWealthState(),
        },
        payload,
        options
      );
      persistCommitments(() => merged.commitments);
      persistLendings(() => merged.lendings);
      persistGoals(() => merged.goals);
      persistDailySpends(() => merged.dailySpends);
      persistSettings(() => merged.settings);
      saveWealthState(merged.wealth);
      if (merged.monthlySnapshots?.length) {
        persistSnapshots(() => merged.monthlySnapshots);
      }
      emitLocalDataChanged();
      return merged.summary;
    },
    [
      lendings,
      goals,
      dailySpends,
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
      getEffectiveStatus: getEffectiveStatusForCtx,
      getEffectiveLendingStatus: getEffectiveLendingStatusForCtx,
      ...crud,
      supplementalNotifications,
      importAppData,
      refreshGoldRate,
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
      getEffectiveStatusForCtx,
      getEffectiveLendingStatusForCtx,
      crud,
      supplementalNotifications,
      importAppData,
      refreshGoldRate,
    ]
  );

  return <PerovoContext.Provider value={value}>{children}</PerovoContext.Provider>;
}

export function usePerovo() {
  const ctx = useContext(PerovoContext);
  if (!ctx) throw new Error("usePerovo must be used within PerovoProvider");
  return ctx;
}
