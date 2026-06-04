/**
 * Local-first vs cloud sync architecture audit.
 */
import fs from "fs";
import path from "path";
import { SRC, rel, walk } from "../lib/audit-core.mjs";

const ALLOWED_SUPABASE_UI = [
  "ui/features/auth/",
  "ui/features/profile/ProfileCloudSyncSection.jsx",
  "ui/features/profile/ProfileBackupSection.jsx",
];

const FORBIDDEN_GOOGLE_BACKUP = [
  "VITE_GOOGLE_CLIENT_ID",
  "accounts.google.com/gsi",
  "googleapis.com/auth/drive",
  "services/drive/",
];

export function runSyncAudit() {
  const errors = [];
  const warnings = [];
  const advisories = [];

  for (const file of walk(SRC, [], /\.(jsx|js)$/)) {
    const r = rel(file);
    if (r.includes("__tests__") || r.startsWith("src/governance/")) continue;
    const code = fs.readFileSync(file, "utf8");

    for (const needle of FORBIDDEN_GOOGLE_BACKUP) {
      if (code.includes(needle)) {
        errors.push({
          kind: "google-backup-removed",
          file: r,
          message: `Legacy Google Drive backup reference (${needle}) — use CommitTrack Cloud (services/sync)`,
        });
      }
    }

    if (
      (code.includes("@supabase/supabase-js") || code.includes("getSupabaseClient")) &&
      !ALLOWED_SUPABASE_UI.some((p) => r.includes(p.replace(/\//g, path.sep))) &&
      !r.startsWith("src/services/")
    ) {
      warnings.push({
        kind: "supabase-in-ui",
        file: r,
        message: "Supabase client in UI layer — route through services/sync or AuthContext",
      });
    }

    if (code.includes("localStorage.setItem") && !r.startsWith("context/") && !r.startsWith("utils/") && !r.startsWith("storage/") && !r.startsWith("services/")) {
      advisories.push({
        kind: "storage-leak",
        file: r,
        message: "Direct localStorage write outside storage/context/utils — prefer centralized persist",
      });
    }
  }

  const bridge = path.join(SRC, "app/CloudSyncBridge.jsx");
  if (!fs.existsSync(bridge)) {
    errors.push({ kind: "sync-bridge", message: "Missing app/CloudSyncBridge.jsx" });
  }

  const migration = path.join(process.cwd(), "supabase/migrations");
  if (!fs.existsSync(migration) || !fs.readdirSync(migration).some((f) => f.includes("user_finance_snapshots"))) {
    advisories.push({
      kind: "sync-schema",
      message: "Apply supabase/migrations/*user_finance_snapshots*.sql for cloud RLS",
    });
  }

  return {
    id: "sync",
    title: "Local-first & cloud sync",
    errors,
    warnings,
    advisories,
  };
}
