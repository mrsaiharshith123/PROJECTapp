import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { todayYmd } from "../utils/dates.js";
import { emitLocalDataChanged } from "../utils/storage/events.js";
import { useAuth } from "./AuthContext.jsx";
import { SCHEMA_VERSION_KEY, CURRENT_SCHEMA_VERSION } from "../utils/migrateStorage.js";
import { getEffectiveLendingStatus } from "../utils/lendingStatus.js";
import { filterByProfile } from "../utils/profileScope.js";
import { getEffectiveStatus } from "../utils/commitmentStatus.js";
import { buildMonthlySnapshot } from "../engines/snapshots.js";
import { mergeImportedAppState } from "../utils/dataImport.js";
import { loadWealthState, saveWealthState } from "../utils/netWorth/wealthStorage.js";
import { sortCommitments } from "./perovoSort.js";
import { usePerovoCrud } from "./usePerovoCrud.js";
import { usePerovoPersistence } from "./usePerovoPersistence.js";
import { useServerSettingsSync } from "./useServerSettingsSync.js";
import { useSubscriptionTierSync } from "./useSubscriptionTierSync.js";
import { useMarketRateSync } from "./useMarketRateSync.js";

/** @type {import('react').Context<import('../types/context.js').PerovoContextValue | null>} */
const PerovoContext = createContext(/** @type {import('../types/context.js').PerovoContextValue | null} */ (null));

/**
 * Composition root for local-first app state. Each concern lives in its own
 * hook (usePerovoPersistence, useServerSettingsSync, useSubscriptionTierSync,
 * useMarketRateSync, usePerovoCrud) — this component wires them together and
 * assembles the context value. Keep new state/effects in a dedicated hook
 * unless they're a single small effect tightly coupled to wiring here.
 */
export function PerovoProvider({ children }) {
  const { user } = useAuth();

  const {
    commitments,
    persistCommitments,
    lendings,
    persistLendings,
    settings,
    setSettings,
    persistSettings,
    settingsRef,
    monthlySnapshots,
    persistSnapshots,
    goals,
    persistGoals,
  } = usePerovoPersistence(user?.id);

  useServerSettingsSync(user, setSettings);
  const { effectiveSubscriptionTier, refreshSubscriptionTier } = useSubscriptionTierSync(user, settings, setSettings);

  // One-time startup schema-version bump — not tied to any state slice above.
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

  const todayStr = todayYmd();

  const [supplementalNotifications, setSupplementalNotifications] = useState([]);

  const crud = usePerovoCrud({
    commitments,
    settings,
    todayStr,
    userId: user?.id,
    persistCommitments,
    persistLendings,
    persistSettings,
    persistGoals,
    setSupplementalNotifications,
  });

  const { updateSettings, updateCommitment } = crud;
  const updateCommitmentRef = useRef(updateCommitment);
  useEffect(() => {
    updateCommitmentRef.current = updateCommitment;
  }, [updateCommitment]);

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    let cancelled = false;
    let unregister = () => {};
    import("../utils/devSubscriptionTools.js").then((mod) => {
      if (cancelled) return;
      mod.registerDevSubscriptionTools({ updateSettings, userId: user?.id ?? null });
      unregister = mod.unregisterDevSubscriptionTools;
    });
    return () => {
      cancelled = true;
      unregister();
    };
  }, [updateSettings, user?.id]);

  const { refreshGoldRate } = useMarketRateSync({
    settingsRef,
    persistSettings,
    commitments,
    todayStr,
    updateCommitmentRef,
  });

  // Build (once per month) a monthly snapshot from the current commitments —
  // orchestrates commitments + settings + snapshots together, so it stays
  // here rather than inside usePerovoPersistence.
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
  }, [commitments, todayStr, persistSnapshots, settingsRef]);

  const commitmentsRef = useRef(commitments);
  useEffect(() => {
    commitmentsRef.current = commitments;
  }, [commitments]);

  const getEffectiveStatusForCtx = useCallback(
    (c) => getEffectiveStatus(c, todayStr, commitmentsRef.current),
    [todayStr]
  );

  const getEffectiveLendingStatusForCtx = useCallback(
    (l) => getEffectiveLendingStatus(l, todayStr),
    [todayStr]
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

  const importAppData = useCallback(
    (payload, options = {}) => {
      const merged = mergeImportedAppState(
        {
          commitments: commitmentsRef.current,
          lendings,
          goals,
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
      persistSettings(() => merged.settings);
      saveWealthState(merged.wealth);
      if (merged.monthlySnapshots?.length) {
        persistSnapshots(() => merged.monthlySnapshots);
      }
      emitLocalDataChanged();
      return merged.summary;
    },
    [lendings, goals, monthlySnapshots, persistCommitments, persistLendings, persistGoals, persistSettings, persistSnapshots, settingsRef]
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
      effectiveSubscriptionTier,
      monthlySnapshots,
      todayStr,
      getEffectiveStatus: getEffectiveStatusForCtx,
      getEffectiveLendingStatus: getEffectiveLendingStatusForCtx,
      addCommitment: crud.addCommitment,
      updateCommitment: crud.updateCommitment,
      deleteCommitment: crud.deleteCommitment,
      addCommitmentPayment: crud.addCommitmentPayment,
      removeCommitmentPayment: crud.removeCommitmentPayment,
      addLending: crud.addLending,
      updateLending: crud.updateLending,
      deleteLending: crud.deleteLending,
      addLendingPayment: crud.addLendingPayment,
      updateSettings: crud.updateSettings,
      addGoal: crud.addGoal,
      updateGoal: crud.updateGoal,
      deleteGoal: crud.deleteGoal,
      pushInAppNotification: crud.pushInAppNotification,
      markNotificationRead: crud.markNotificationRead,
      markAllNotificationsRead: crud.markAllNotificationsRead,
      logSavingsToGoal: crud.logSavingsToGoal,
      supplementalNotifications,
      importAppData,
      refreshGoldRate,
      refreshSubscriptionTier,
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
      effectiveSubscriptionTier,
      monthlySnapshots,
      todayStr,
      getEffectiveStatusForCtx,
      getEffectiveLendingStatusForCtx,
      crud.addCommitment,
      crud.updateCommitment,
      crud.deleteCommitment,
      crud.addCommitmentPayment,
      crud.removeCommitmentPayment,
      crud.addLending,
      crud.updateLending,
      crud.deleteLending,
      crud.addLendingPayment,
      crud.updateSettings,
      crud.addGoal,
      crud.updateGoal,
      crud.deleteGoal,
      crud.pushInAppNotification,
      crud.markNotificationRead,
      crud.markAllNotificationsRead,
      crud.logSavingsToGoal,
      supplementalNotifications,
      importAppData,
      refreshGoldRate,
      refreshSubscriptionTier,
    ]
  );

  return <PerovoContext.Provider value={value}>{children}</PerovoContext.Provider>;
}

export function usePerovo() {
  const ctx = useContext(PerovoContext);
  if (!ctx) throw new Error("usePerovo must be used within PerovoProvider");
  return ctx;
}
