import {
  normalizeCommitment,
  normalizeGoal,
  normalizeLending,
  normalizeProfiles,
} from "./migrateStorage.js";
import { normalizeDailySpend } from "./dailySpends.js";
import { isAppSnapshot } from "../storage/appSnapshot.js";

const SCHEMA_VERSION = 2;

function dedupeById(items) {
  const map = new Map();
  for (const item of items) {
    if (item?.id != null) map.set(String(item.id), item);
  }
  return [...map.values()];
}

/**
 * Validate export JSON and merge into current app state.
 * @returns {{ commitments, lendings, goals, settings, monthlySnapshots, dailySpends, summary }}
 */
export function mergeImportedAppState(current, payload, { mode = "merge" } = {}) {
  if (!isAppSnapshot(payload)) {
    throw new Error("Invalid file — expected a CommitTrack export JSON object.");
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
  };

  const monthlySnapshots =
    mode === "replace" && incomingSnapshots.length
      ? incomingSnapshots
      : dedupeById([...(current.monthlySnapshots || []), ...incomingSnapshots]);

  return {
    commitments,
    lendings,
    goals,
    settings,
    monthlySnapshots,
    dailySpends,
    summary: {
      schemaVersion: SCHEMA_VERSION,
      addedCommitments: normCommitments.length,
      addedLendings: normLendings.length,
      addedGoals: normGoals.length,
      addedDailySpends: normDailySpends.length,
      mode,
    },
  };
}

export function previewImportCounts(payload) {
  if (!isAppSnapshot(payload)) return null;
  return {
    commitments: Array.isArray(payload.commitments) ? payload.commitments.length : 0,
    lendings: Array.isArray(payload.lendings) ? payload.lendings.length : 0,
    goals: Array.isArray(payload.goals) ? payload.goals.length : 0,
    dailySpends: Array.isArray(payload.dailySpends) ? payload.dailySpends.length : 0,
    hasSettings: Boolean(payload.settings),
  };
}
