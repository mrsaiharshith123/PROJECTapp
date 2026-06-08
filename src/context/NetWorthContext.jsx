import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { format } from "date-fns";
import { useCommitTrack } from "./CommitTrackContext.jsx";
import {
  loadWealthState,
  saveWealthState,
  filterWealthByProfile,
  normalizeWealthEntry,
} from "../utils/netWorth/wealthStorage.js";
import { computeNetWorthCore, computeGrowthRates } from "../engines/netWorth/core.js";
import { detectNewMilestones } from "../engines/netWorth/milestones.js";

/**
 * @typedef {object} NetWorthStoreValue
 * @property {import('../utils/netWorth/wealthStorage.js').WealthEntry[]} entries
 * @property {import('../utils/netWorth/wealthStorage.js').WealthEntry[]} allEntries
 * @property {import('../utils/netWorth/wealthStorage.js').WealthSnapshot[]} snapshots
 * @property {import('../utils/netWorth/wealthStorage.js').WealthMilestone[]} milestones
 * @property {boolean} privacyMode
 * @property {number} savingsStreakMonths
 * @property {ReturnType<import('../engines/netWorth/core.js').computeNetWorthCore>} core
 * @property {ReturnType<import('../engines/netWorth/core.js').computeGrowthRates>} growth
 * @property {(raw: object) => void} addEntry
 * @property {(id: string, patch: object) => void} updateEntry
 * @property {(id: string) => void} deleteEntry
 * @property {() => void} togglePrivacyMode
 * @property {() => void} recordMonthlySnapshot
 */

/** @type {import('react').Context<NetWorthStoreValue | null>} */
const NetWorthContext = createContext(/** @type {NetWorthStoreValue | null} */ (null));

export function NetWorthProvider({ children }) {
  const { settings, activeProfileId } = useCommitTrack();
  const [state, setState] = useState(() => loadWealthState());

  const persist = useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return saveWealthState(next);
    });
  }, []);

  const profileEntries = useMemo(
    () => filterWealthByProfile(state.entries, activeProfileId || settings.activeProfileId || "default"),
    [state.entries, activeProfileId, settings.activeProfileId]
  );

  const recordMonthlySnapshot = useCallback(() => {
    const core = computeNetWorthCore(profileEntries);
    const monthKey = format(new Date(), "yyyy-MM");
    persist((prev) => {
      if (prev.snapshots.some((s) => s.month === monthKey)) return prev;
      const snap = {
        month: monthKey,
        netWorth: core.netWorth,
        totalAssets: core.totalAssets,
        totalLiabilities: core.totalLiabilities,
        liquidNetWorth: core.liquidNetWorth,
        recordedAt: Date.now(),
      };
      const snapshots = [...prev.snapshots, snap].sort((a, b) => a.month.localeCompare(b.month)).slice(-48);
      const newMilestones = detectNewMilestones(
        { ...core, savingsStreakMonths: prev.savingsStreakMonths },
        prev.milestones
      );
      return {
        ...prev,
        snapshots,
        milestones: [...prev.milestones, ...newMilestones],
      };
    });
  }, [persist, profileEntries]);

  const addEntry = useCallback(
    (raw) => {
      const entry = normalizeWealthEntry({
        ...raw,
        profileId: raw.profileId ?? activeProfileId ?? settings.activeProfileId ?? "default",
      });
      persist((prev) => ({ ...prev, entries: [...prev.entries, entry] }));
      recordMonthlySnapshot();
    },
    [persist, activeProfileId, settings.activeProfileId, recordMonthlySnapshot]
  );

  const updateEntry = useCallback(
    (id, patch) => {
      persist((prev) => ({
        ...prev,
        entries: prev.entries.map((e) =>
          String(e.id) !== String(id)
            ? e
            : normalizeWealthEntry({ ...e, ...patch, id: e.id, updatedAt: Date.now() })
        ),
      }));
      recordMonthlySnapshot();
    },
    [persist, recordMonthlySnapshot]
  );

  const deleteEntry = useCallback(
    (id) => {
      persist((prev) => ({
        ...prev,
        entries: prev.entries.filter((e) => String(e.id) !== String(id)),
      }));
      recordMonthlySnapshot();
    },
    [persist, recordMonthlySnapshot]
  );

  const togglePrivacyMode = useCallback(() => {
    persist((prev) => ({ ...prev, privacyMode: !prev.privacyMode }));
  }, [persist]);

  const core = useMemo(() => computeNetWorthCore(profileEntries), [profileEntries]);
  const growth = useMemo(
    () => computeGrowthRates(state.snapshots, core.netWorth),
    [state.snapshots, core.netWorth]
  );

  const value = useMemo(
    () => ({
      entries: profileEntries,
      allEntries: state.entries,
      snapshots: state.snapshots,
      milestones: state.milestones,
      privacyMode: state.privacyMode,
      savingsStreakMonths: state.savingsStreakMonths,
      core,
      growth,
      addEntry,
      updateEntry,
      deleteEntry,
      togglePrivacyMode,
      recordMonthlySnapshot,
    }),
    [
      profileEntries,
      state.entries,
      state.snapshots,
      state.milestones,
      state.privacyMode,
      state.savingsStreakMonths,
      core,
      growth,
      addEntry,
      updateEntry,
      deleteEntry,
      togglePrivacyMode,
      recordMonthlySnapshot,
    ]
  );

  return <NetWorthContext.Provider value={value}>{children}</NetWorthContext.Provider>;
}

/** @returns {NetWorthStoreValue} */
export function useNetWorth() {
  const ctx = useContext(NetWorthContext);
  if (!ctx) throw new Error("useNetWorth must be used within NetWorthProvider");
  return ctx;
}
