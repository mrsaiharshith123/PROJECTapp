import {
  normalizeCommitment,
  normalizeGoal,
  normalizeLending,
  normalizeProfiles,
} from "./migrateStorage.js";
import { normalizeDailySpend } from "./dailySpends.js";
import { isAppSnapshot } from "../storage/appSnapshot.js";
import { normalizeWealthEntry, normalizeWealthState } from "./netWorth/wealthStorage.js";

const SCHEMA_VERSION = 2;

function dedupeById(items) {
  const map = new Map();
  for (const item of items) {
    if (item?.id != null) map.set(String(item.id), item);
  }
  return [...map.values()];
}

/** @param {unknown} payload */
function extractWealthFromPayload(payload) {
  const p = /** @type {Record<string, unknown>} */ (payload || {});
  if (p.wealth && typeof p.wealth === "object") return normalizeWealthState(p.wealth);
  if (Array.isArray(p.wealthEntries)) return normalizeWealthState({ entries: p.wealthEntries });
  return null;
}

/**
 * @param {import('./netWorth/wealthStorage.js').WealthState} current
 * @param {unknown} payload
 * @param {'merge' | 'replace'} mode
 */
function mergeWealthState(current, payload, mode) {
  const incoming = extractWealthFromPayload(payload);
  if (!incoming) {
    return current;
  }
  if (mode === "replace") {
    return incoming;
  }
  const entries = dedupeById([
    ...(current.entries || []).map(normalizeWealthEntry),
    ...incoming.entries.map(normalizeWealthEntry),
  ]);
  return normalizeWealthState({
    ...current,
    entries,
    snapshots: dedupeById([...(current.snapshots || []), ...incoming.snapshots]),
    dailySnapshots: dedupeById([...(current.dailySnapshots || []), ...incoming.dailySnapshots]),
    milestones: dedupeById([...(current.milestones || []), ...incoming.milestones]),
  });
}

/**
 * Validate export JSON and merge into current app state.
 * @returns {{ commitments, lendings, goals, settings, monthlySnapshots, dailySpends, wealth, summary }}
 */
export function mergeImportedAppState(current, payload, { mode = "merge" } = {}) {
  if (!isAppSnapshot(payload)) {
    throw new Error("Invalid file — expected a Perovo export JSON object.");
  }

  const incomingCommitments = Array.isArray(payload.commitments) ? payload.commitments : [];
  const incomingLendings = Array.isArray(payload.lendings) ? payload.lendings : [];
  const incomingGoals = Array.isArray(payload.goals) ? payload.goals : [];
  const incomingSnapshots = Array.isArray(payload.monthlySnapshots) ? payload.monthlySnapshots : [];
  const incomingDailySpends = Array.isArray(payload.dailySpends) ? payload.dailySpends : [];
  const incomingSettings =
    payload.settings && typeof payload.settings === "object" ? payload.settings : {};

  const normCommitments = incomingCommitments.map((c) => normalizeCommitment(c));
  const normLendings = incomingLendings.map((l) => normalizeLending(l));
  const normGoals = incomingGoals.map((g) => normalizeGoal(g));
  const normDailySpends = incomingDailySpends.map((s) => normalizeDailySpend(s));

  let commitments;
  let lendings;
  let goals;
  let dailySpends;
  if (mode === "replace") {
    commitments = normCommitments;
    lendings = normLendings;
    goals = normGoals;
    dailySpends = normDailySpends;
  } else {
    commitments = dedupeById([...current.commitments, ...normCommitments]);
    lendings = dedupeById([...current.lendings, ...normLendings]);
    goals = dedupeById([...current.goals, ...normGoals]);
    dailySpends = dedupeById([...(current.dailySpends || []), ...normDailySpends]);
  }

  const settings = {
    ...current.settings,
    ...incomingSettings,
    profiles: incomingSettings.profiles
      ? normalizeProfiles(incomingSettings.profiles)
      : current.settings.profiles,
    cloudSyncEnabled: current.settings.cloudSyncEnabled,
  };

  const monthlySnapshots =
    mode === "replace" && incomingSnapshots.length
      ? incomingSnapshots
      : dedupeById([...(current.monthlySnapshots || []), ...incomingSnapshots]);

  const wealth = mergeWealthState(
    normalizeWealthState(current.wealth || { entries: [] }),
    payload,
    mode,
  );

  return {
    commitments,
    lendings,
    goals,
    settings,
    monthlySnapshots,
    dailySpends,
    wealth,
    summary: {
      schemaVersion: SCHEMA_VERSION,
      addedCommitments: normCommitments.length,
      addedLendings: normLendings.length,
      addedGoals: normGoals.length,
      addedDailySpends: normDailySpends.length,
      addedWealthEntries: extractWealthFromPayload(payload)?.entries?.length ?? 0,
      mode,
    },
  };
}

export function previewImportCounts(payload) {
  if (!isAppSnapshot(payload)) return null;
  const wealth = extractWealthFromPayload(payload);
  return {
    commitments: Array.isArray(payload.commitments) ? payload.commitments.length : 0,
    lendings: Array.isArray(payload.lendings) ? payload.lendings.length : 0,
    goals: Array.isArray(payload.goals) ? payload.goals.length : 0,
    dailySpends: Array.isArray(payload.dailySpends) ? payload.dailySpends.length : 0,
    wealth: wealth?.entries?.length ?? 0,
    hasSettings: Boolean(payload.settings),
  };
}
