/**
 * Supabase schema, RLS, and migration quality audit.
 * Role: Database Architect
 */
import fs from "fs";
import path from "path";
import { ROOT } from "../lib/audit-core.mjs";

export function runDatabaseAudit() {
  const errors = [], warnings = [], advisories = [];
  const migrationsDir = path.join(ROOT, "supabase/migrations");

  if (!fs.existsSync(migrationsDir)) {
    errors.push({ kind: "no-migrations", message: "supabase/migrations/ not found" });
    return { id: "database", title: "Database schema & RLS audit", errors, warnings, advisories };
  }

  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith(".sql"))
    .sort();

  // Check all tables have RLS enabled
  const allSql = migrationFiles.map(f => fs.readFileSync(path.join(migrationsDir, f), "utf8")).join("\n");
  const tables = [...allSql.matchAll(/create table (?:if not exists )?public\.(\w+)/gi)].map(m => m[1]);
  const rlsEnabled = new Set([
    ...[...allSql.matchAll(/enable row level security\s+on\s+(?:public\.)?(\w+)/gi)].map((m) => m[1]),
    ...[...allSql.matchAll(/alter\s+table\s+(?:public\.)?(\w+)\s+enable\s+row\s+level\s+security/gi)].map((m) => m[1]),
  ]);

  for (const table of tables) {
    if (!rlsEnabled.has(table)) {
      errors.push({ kind: "missing-rls", message: `Table '${table}' has no RLS enabled — all rows accessible to any authenticated user` });
    }
  }

  // Check for single-column ALTER TABLE migrations (should be batched)
  const singleColumnAlters = migrationFiles.filter(f => {
    const sql = fs.readFileSync(path.join(migrationsDir, f), "utf8");
    const alters = (sql.match(/alter table\s+\S+\s+add column/gi) || []).length;
    const creates = (sql.match(/create table/gi) || []).length;
    return alters === 1 && creates === 0 && sql.split("\n").filter(l => l.trim()).length < 10;
  });
  if (singleColumnAlters.length > 3) {
    advisories.push({ kind: "fragmented-migrations",
      message: `${singleColumnAlters.length} migrations each add a single column — could be batched into fewer migrations`,
      detail: singleColumnAlters.join(", ") });
  }

  // Migration naming convention check
  const badNames = migrationFiles.filter(f => !/^\d{14}_[\w-]+\.sql$/.test(f));
  if (badNames.length > 0) {
    warnings.push({ kind: "migration-naming",
      message: `${badNames.length} migration(s) don't follow YYYYMMDDHHMMSS_name.sql convention`,
      detail: badNames.join(", ") });
  }

  // Check for indexes on foreign key-like columns
  const hasUserIdColumn = /user_id\s+uuid/i.test(allSql);
  const hasUserIdIndex  = /create index.*user_id/i.test(allSql);
  if (hasUserIdColumn && !hasUserIdIndex) {
    warnings.push({ kind: "missing-index",
      message: "user_id columns exist but no explicit index found — add CREATE INDEX for query performance at scale" });
  }

  // Check for delete cascade on user data (GDPR/data cleanup)
  const hasDeleteCascade = /on delete cascade/i.test(allSql);
  if (!hasDeleteCascade) {
    advisories.push({ kind: "no-delete-cascade",
      message: "No ON DELETE CASCADE found — user account deletion may leave orphaned rows in related tables" });
  }

  // Count total policies
  const policyCount = (allSql.match(/create policy/gi) || []).length;
  if (policyCount < tables.length * 2) {
    advisories.push({ kind: "low-policy-count",
      message: `${policyCount} RLS policies for ${tables.length} tables — verify read AND write policies exist for each table` });
  }

  return { id: "database", title: "Database schema, RLS & migrations", errors, warnings, advisories };
}
