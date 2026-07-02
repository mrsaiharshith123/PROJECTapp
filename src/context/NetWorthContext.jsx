import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { usePerovo } from "./PerovoContext.jsx";
import { DATA_CHANGED_EVENT } from "../utils/storage/events.js";
import {
  loadWealthState,
  saveWealthState,
  filterWealthByProfile,
  normalizeWealthEntry,
  invalidateWealthCache,
  dedupeWealthEntries,
} from "../utils/netWorth/wealthStorage.js";
import { appendDailyWealthSnapshot } from "../utils/netWorth/dailySnapshot.js";
import { computeNetWorthCore, computeGrowthRates } from "../engines/netWorth/core.js";
import { detectNewMilestones } from "../engines/netWorth/milestones.js";

/**
 * @typedef {object} NetWorthStoreValue
 * @property {import('../utils/netWorth/wealthStorage.js').WealthEntry[]} entries
 * @property {import('../utils/netWorth/wealthStorage.js').WealthEntry[]} allEntries
 * @property {import('../utils/netWorth/wealthStorage.js').WealthSnapshot[]} snapshots
 * @property {import('../utils/netWorth/wealthStorage.js').WealthSnapshot[]} dailySnapshots
 * @property {import('../utils/netWorth/wealthStorage.js').WealthMilestone[]} milestones
 * @property {boolean} privacyMode
 * @property {number} savingsStreakMonths
 * @property {ReturnType<import('../engines/netWorth/core.js').computeNetWorthCore>} core
 * @property {ReturnType<import('../engines/netWorth/core.js').computeGrowthRates>} growth
 * @property {(raw: object) => void} addEntry
 * @property {(id: string, patch: object) => void} updateEntry
 * @property {(id: string) => void} deleteEntry
 * @property {() => void} togglePrivacyMode
 * @property {() => void} recordDailySnapshot
 */

/** @type {import('react').Context<NetWorthStoreValue | null>} */
const NetWorthContext = createContext(/** @type {NetWorthStoreValue | null} */ (null));

function hasTodayDailySnapshot(snapshots) {
  const today = format(new Date(), "yyyy-MM-dd");
  return (snapshots || []).some((s) => s.day === today || s.month === today);
}

function withSnapshots(prev, profileEntries) {
  const core = computeNetWorthCore(profileEntries);
  const monthKey = format(new Date(), "yyyy-MM");
  let next = appendDailyWealthSnapshot(prev, core);
  if (!next.snapshots.some((s) => s.month === monthKey)) {
    const snap = {
      month: monthKey,
      netWorth: core.netWorth,
      totalAssets: core.totalAssets,
      totalLiabilities: core.totalLiabilities,
      liquidNetWorth: core.liquidNetWorth,
      recordedAt: Date.now(),
    };
    const snapshots = [...next.snapshots, snap].sort((a, b) => a.month.localeCompare(b.month)).slice(-48);
    const newMilestones = detectNewMilestones(
      { ...core, savingsStreakMonths: next.savingsStreakMonths },
      next.milestones,
    );
    next = {
      ...next,
      snapshots,
      milestones: [...next.milestones, ...newMilestones],
    };
  }
  return next;
}

function newWealthEntryId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `wealth-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function NetWorthProvider({ children }) {
  const { settings, activeProfileId } = usePerovo();
  const [state, setState] = useState(() => loadWealthState());
  const skipExternalReloadRef = useRef(false);
  const profileId = activeProfileId || settings.activeProfileId || "default";

  const persist = useCallback((updater) => {
    skipExternalReloadRef.current = true;
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return saveWealthState(next);
    });
    queueMicrotask(() => {
      skipExternalReloadRef.current = false;
    });
  }, []);

  const profileEntries = useMemo(
    () => filterWealthByProfile(state.entries, profileId),
    [state.entries, profileId, settings],
  );

  const recordDailySnapshot = useCallback(() => {
    persist((prev) => withSnapshots(prev, profileEntries));
  }, [persist, profileEntries]);

  const snapshotBootRef = useRef(false);

  useEffect(() => {
    const onDataChanged = () => {
      if (skipExternalReloadRef.current) return;
      invalidateWealthCache();
      setState(loadWealthState());
    };
    window.addEventListener(DATA_CHANGED_EVENT, onDataChanged);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, onDataChanged);
  }, []);

  // Record today's snapshot once on boot — never re-run on dailySnapshots churn (avoids update loops).
  useEffect(() => {
    if (snapshotBootRef.current) return;
    snapshotBootRef.current = true;
    if (!profileEntries.length) return;
    if (hasTodayDailySnapshot(state.dailySnapshots)) return;
    queueMicrotask(() => recordDailySnapshot());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-shot boot
  }, []);

  const addEntry = useCallback(
    (raw) => {
      const entryId = raw.id != null ? String(raw.id) : newWealthEntryId();
      const entry = normalizeWealthEntry({
        ...raw,
        id: entryId,
        profileId: raw.profileId ?? profileId,
      });
      persist((prev) => {
        if (prev.entries.some((e) => String(e.id) === String(entry.id))) return prev;
        const entries = dedupeWealthEntries([...prev.entries, entry]);
        const scoped = filterWealthByProfile(entries, profileId);
        return withSnapshots({ ...prev, entries }, scoped);
      });
    },
    [persist, profileId],
  );

  const updateEntry = useCallback(
    (id, patch) => {
      persist((prev) => {
        const entries = prev.entries.map((e) =>
          String(e.id) !== String(id)
            ? e
            : normalizeWealthEntry({ ...e, ...patch, id: e.id, updatedAt: Date.now() }),
        );
        const scoped = filterWealthByProfile(entries, profileId);
        return withSnapshots({ ...prev, entries }, scoped);
      });
    },
    [persist, profileId],
  );

  const deleteEntry = useCallback(
    (id) => {
      persist((prev) => {
        const entries = prev.entries.filter((e) => String(e.id) !== String(id));
        const scoped = filterWealthByProfile(entries, profileId);
        return withSnapshots({ ...prev, entries }, scoped);
      });
    },
    [persist, profileId],
  );

  const togglePrivacyMode = useCallback(() => {
    persist((prev) => ({ ...prev, privacyMode: !prev.privacyMode }));
  }, [persist]);

  const core = useMemo(() => computeNetWorthCore(profileEntries), [profileEntries]);
  const growth = useMemo(
    () => computeGrowthRates(state.snapshots, core.netWorth),
    [state.snapshots, core.netWorth],
  );

  const value = useMemo(
    () => ({
      entries: profileEntries,
      allEntries: state.entries,
      snapshots: state.snapshots,
      dailySnapshots: state.dailySnapshots || [],
      milestones: state.milestones,
      privacyMode: state.privacyMode,
      savingsStreakMonths: state.savingsStreakMonths,
      core,
      growth,
      addEntry,
      updateEntry,
      deleteEntry,
      togglePrivacyMode,
      recordDailySnapshot,
    }),
    [
      profileEntries,
      state.entries,
      state.snapshots,
      state.dailySnapshots,
      state.milestones,
      state.privacyMode,
      state.savingsStreakMonths,
      core,
      growth,
      addEntry,
      updateEntry,
      deleteEntry,
      togglePrivacyMode,
      recordDailySnapshot,
    ],
  );

  return <NetWorthContext.Provider value={value}>{children}</NetWorthContext.Provider>;
}

/** @returns {NetWorthStoreValue} */
export function useNetWorth() {
  const ctx = useContext(NetWorthContext);
  if (!ctx) throw new Error("useNetWorth must be used within NetWorthProvider");
  return ctx;
}
