import {
  normalizeCommitment,
  normalizeGoal,
  normalizeLending,
  normalizeProfiles,
} from "./migrateStorage.js";

const SCHEMA_VERSION = 1;

function dedupeById(items) {
  const map = new Map();
  for (const item of items) {
    if (item?.id != null) map.set(String(item.id), item);
  }
  return [...map.values()];
}

/**
 * Validate export JSON and merge into current app state.
 * @returns {{ commitments, lendings, goals, settings, monthlySnapshots, summary }}
 */
export function mergeImportedAppState(current, payload, { mode = "merge" } = {}) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid file — expected a JSON object.");
  }

  const incomingCommitments = Array.isArray(payload.commitments) ? payload.commitments : [];
  const incomingLendings = Array.isArray(payload.lendings) ? payload.lendings : [];
  const incomingGoals = Array.isArray(payload.goals) ? payload.goals : [];
  const incomingSnapshots = Array.isArray(payload.monthlySnapshots) ? payload.monthlySnapshots : [];
  const incomingSettings =
    payload.settings && typeof payload.settings === "object" ? payload.settings : {};

  const normCommitments = incomingCommitments.map((c) => normalizeCommitment(c));
  const normLendings = incomingLendings.map((l) => normalizeLending(l));
  const normGoals = incomingGoals.map((g) => normalizeGoal(g));

  let commitments;
  let lendings;
  let goals;
  if (mode === "replace") {
    commitments = normCommitments;
    lendings = normLendings;
    goals = normGoals;
  } else {
    commitments = dedupeById([...current.commitments, ...normCommitments]);
    lendings = dedupeById([...current.lendings, ...normLendings]);
    goals = dedupeById([...current.goals, ...normGoals]);
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
    summary: {
      schemaVersion: SCHEMA_VERSION,
      addedCommitments: normCommitments.length,
      addedLendings: normLendings.length,
      addedGoals: normGoals.length,
      mode,
    },
  };
}

export function previewImportCounts(payload) {
  if (!payload || typeof payload !== "object") return null;
  return {
    commitments: Array.isArray(payload.commitments) ? payload.commitments.length : 0,
    lendings: Array.isArray(payload.lendings) ? payload.lendings.length : 0,
    goals: Array.isArray(payload.goals) ? payload.goals.length : 0,
    hasSettings: Boolean(payload.settings),
  };
}
