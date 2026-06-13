import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useCommitTrack } from "./CommitTrackContext.jsx";
import {
  loadWealthState,
  saveWealthState,
  filterWealthByProfile,
  normalizeWealthEntry,
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

export function NetWorthProvider({ children }) {
  const { settings, activeProfileId } = useCommitTrack();
  const [state, setState] = useState(() => loadWealthState());
  const profileId = activeProfileId || settings.activeProfileId || "default";

  const persist = useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return saveWealthState(next);
    });
  }, []);

  const profileEntries = useMemo(
    () => filterWealthByProfile(state.entries, profileId),
    [state.entries, profileId],
  );

  const recordDailySnapshot = useCallback(() => {
    persist((prev) => withSnapshots(prev, profileEntries));
  }, [persist, profileEntries]);

  useEffect(() => {
    if (!profileEntries.length) return;
    const today = format(new Date(), "yyyy-MM-dd");
    if ((state.dailySnapshots || []).some((s) => s.day === today)) return;
    queueMicrotask(() => recordDailySnapshot());
  }, [profileEntries, state.dailySnapshots, recordDailySnapshot]);

  const addEntry = useCallback(
    (raw) => {
      const entry = normalizeWealthEntry({
        ...raw,
        profileId: raw.profileId ?? profileId,
      });
      persist((prev) => {
        const entries = [...prev.entries, entry];
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
