/** Browser localStorage keys — single source of truth for persistence. */
export const STORAGE_KEYS = {
  commitments: "commitments",
  lendings: "lendings",
  settings: "perovo_settings",
  monthlySnapshots: "perovo_monthly_snapshots",
  goals: "perovo_goals",
  schemaVersion: "perovo_schema_version",
  syncMeta: "perovo_sync_meta",
  wealth: "perovo_wealth",
  authSeeded: (userId) => `perovo_auth_seeded_${userId}`,
  profileSeeded: (userId) => `perovo_profile_seeded_${userId}`,
};
