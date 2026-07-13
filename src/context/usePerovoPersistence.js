import { useCallback, useEffect, useRef, useState } from "react";
import { todayYmd } from "../utils/dates.js";
import { normalizeCommitmentStatusForSave } from "../utils/commitmentStatus.js";
import { emitLocalDataChanged, SETTINGS_RESET_EVENT } from "../utils/storage/events.js";
import { syncSettingsToServer } from "../services/supabase/auth.js";
import {
  loadInitialAppState,
  loadSettingsFromStorage,
  invalidateInitialAppStateCache,
  saveMonthlySnapshotsToStorage,
  saveGoalsToStorage,
  normalizeCommitment,
  normalizeLending,
} from "../utils/migrateStorage.js";
import { saveSyncMeta } from "../services/sync/syncMeta.js";
import { refreshAllChitCommitments } from "../utils/chitSync.js";

/**
 * Owns the four local-first data slices (commitments, lendings, settings,
 * monthly snapshots, goals) and their "write to localStorage + notify" path.
 * This is the single place that touches localStorage for these keys — no
 * other hook/component should call localStorage.setItem for them directly.
 *
 * Split out of PerovoContext.jsx so the provider isn't a 500+ line file
 * mixing persistence, server-sync, and market-data-refresh concerns.
 *
 * @param {string | undefined} userId
 */
export function usePerovoPersistence(userId) {
  const syncTimerRef = useRef(null);
  const userIdRef = useRef(userId);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);
  useEffect(() => {
    return () => clearTimeout(syncTimerRef.current);
  }, []);

  const [commitments, setCommitments] = useState(() =>
    refreshAllChitCommitments(loadInitialAppState().commitments, todayYmd())
  );
  const [lendings, setLendings] = useState(() => loadInitialAppState().lendings);
  const [settings, setSettings] = useState(() => loadInitialAppState().settings);
  const [monthlySnapshots, setMonthlySnapshots] = useState(() => loadInitialAppState().monthlySnapshots);
  const [goals, setGoals] = useState(() => loadInitialAppState().goals);

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    const onSettingsReset = () => setSettings(loadSettingsFromStorage());
    window.addEventListener(SETTINGS_RESET_EVENT, onSettingsReset);
    return () => window.removeEventListener(SETTINGS_RESET_EVENT, onSettingsReset);
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

  return {
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
  };
}
