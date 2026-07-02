import fs from "fs";
import path from "path";
import { ROOT, rel, walk } from "../lib/audit-core.mjs";

const STALE_ROOT_FILES = [
  { name: "public.zip", reason: "Stale archive of public/ — delete and use public/ only" },
];

const LEGACY_FOLDERS = ["appversion", "webversion", "src/components", "src/pages", "src/screens"];

const ONE_OFF_SCRIPTS = [
  "scripts/rebrand-tadsaya.mjs",
  "scripts/rebrand-perovo-full.mjs",
  "scripts/rebrand-perovo-i18n.mjs",
  "scripts/rebrand-user-facing.mjs",
];

function dirIsEmptyOrOnlyGitkeep(dir) {
  if (!fs.existsSync(dir)) return false;
  const entries = fs.readdirSync(dir).filter((e) => e !== ".gitkeep");
  return entries.length === 0;
}

export function runCleanupAudit() {
  const errors = [];
  const warnings = [];
  const advisories = [];

  for (const { name, reason } of STALE_ROOT_FILES) {
    const p = path.join(ROOT, name);
    if (fs.existsSync(p)) {
      warnings.push({ kind: "stale-file", message: `${name}: ${reason}` });
    }
  }

  for (const folder of LEGACY_FOLDERS) {
    const p = path.join(ROOT, folder);
    if (fs.existsSync(p)) {
      const empty = dirIsEmptyOrOnlyGitkeep(p);
      errors.push({
        kind: "legacy-folder",
        message: empty
          ? `Remove empty legacy folder ${folder}/`
          : `Remove or migrate legacy folder ${folder}/ — product code belongs in src/ui/`,
      });
    }
  }

  for (const script of ONE_OFF_SCRIPTS) {
    const p = path.join(ROOT, script);
    if (fs.existsSync(p)) {
      advisories.push({
        kind: "one-off-script",
        message: `${script} — one-time rebrand script; safe to delete after migration`,
      });
    }
  }

  const scriptsDir = path.join(ROOT, "scripts");
  if (fs.existsSync(scriptsDir)) {
    const names = fs.readdirSync(scriptsDir);
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    if (dupes.length) {
      warnings.push({ kind: "duplicate-script", message: `Duplicate script names in scripts/: ${dupes.join(", ")}` });
    }
  }

  const distPath = path.join(ROOT, "dist");
  const devDistPath = path.join(ROOT, "dev-dist");
  if (fs.existsSync(distPath)) {
    advisories.push({ kind: "build-artifact", message: "dist/ present locally — gitignored; run npm run clean before audit if stale" });
  }
  if (fs.existsSync(devDistPath)) {
    advisories.push({ kind: "build-artifact", message: "dev-dist/ present — PWA dev cache; safe to delete" });
  }

  const govSrc = path.join(ROOT, "src", "governance");
  if (fs.existsSync(govSrc)) {
    errors.push({
      kind: "governance-in-bundle",
      file: "src/governance/",
      message: "Remove src/governance/ — registries live in scripts/registries/",
    });
  }

  let buttonCount = 0;
  for (const file of walk(path.join(ROOT, "src"), [], /\.(jsx|js)$/)) {
    const code = fs.readFileSync(file, "utf8");
    const matches = code.match(/<button(?=[^>]*>)(?![^>]*\btype\s*=)(\s)/g) || [];
    buttonCount += matches.length;
  }
  if (buttonCount > 0) {
    errors.push({
      kind: "button-missing-type",
      message: `${buttonCount} <button> elements missing type= — run npm run fix:buttons`,
    });
  }

  const migrateFile = path.join(ROOT, "src", "utils", "migrateStorage.js");
  if (fs.existsSync(migrateFile)) {
    const code = fs.readFileSync(migrateFile, "utf8");
    const count = (code.match(/export const SCHEMA_VERSION_KEY/g) || []).length;
    if (count > 1) {
      warnings.push({
        kind: "duplicate-export",
        file: "src/utils/migrateStorage.js",
        message: `SCHEMA_VERSION_KEY exported ${count} times — remove duplicate`,
      });
    }
  }

  return {
    id: "cleanup",
    title: "Stale files, ghost folders & one-off scripts",
    errors,
    warnings,
    advisories,
  };
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  const { printReport, exitCode, parseArgs } = await import("../lib/audit-core.mjs");
  const opts = parseArgs();
  const report = runCleanupAudit();
  const s = printReport(report, opts);
  process.exit(exitCode(s, opts.strict));
}
