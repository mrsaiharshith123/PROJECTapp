#!/usr/bin/env node
/**
 * Full perovo → Perovo rebrand (identifiers, storage keys, user-facing strings).
 * Run: node scripts/rebrand-perovo-full.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const RENAMES = [
  ["src/context/perovoContext.jsx", "src/context/PerovoContext.jsx"],
  ["src/context/perovoSort.js", "src/context/perovoSort.js"],
  ["src/context/useperovoCrud.js", "src/context/usePerovoCrud.js"],
];

const REPLACEMENTS = [
  [/perovoContext\.jsx/g, "PerovoContext.jsx"],
  [/useperovoCrud\.js/g, "usePerovoCrud.js"],
  [/perovoSort\.js/g, "perovoSort.js"],
  [/perovoContextValue/g, "PerovoContextValue"],
  [/perovoProvider/g, "PerovoProvider"],
  [/useperovoCrud/g, "usePerovoCrud"],
  [/useperovo/g, "usePerovo"],
  [/perovoContext/g, "PerovoContext"],
  [/perovoSort/g, "perovoSort"],
  [/perovo_settings/g, "perovo_settings"],
  [/perovo_monthly_snapshots/g, "perovo_monthly_snapshots"],
  [/perovo_goals/g, "perovo_goals"],
  [/perovo_daily_spends/g, "perovo_daily_spends"],
  [/perovo_schema_version/g, "perovo_schema_version"],
  [/perovo_sync_meta/g, "perovo_sync_meta"],
  [/perovo_wealth/g, "perovo_wealth"],
  [/perovo_signup_pending/g, "perovo_signup_pending"],
  [/perovo_auth_seeded_/g, "perovo_auth_seeded_"],
  [/perovo_profile_seeded_/g, "perovo_profile_seeded_"],
  [/perovo_analytics_session/g, "perovo_analytics_session"],
  [/perovo_tools_nudge_dismissed/g, "perovo_tools_nudge_dismissed"],
  [/perovo_tools_nudge_session/g, "perovo_tools_nudge_session"],
  [/perovo-/g, "perovo-"],
  [/perovo\./g, "perovo."],
  [/perovo\.app/g, "perovo.app"],
  [/app\.perovo\.twa/g, "app.perovo.twa"],
  [/com\.perovo/g, "com.perovo"],
  [/grant_perovo_admin/g, "grant_perovo_admin"],
  [/on_auth_user_created_perovo/g, "on_auth_user_created_perovo"],
  [/perovo/g, "Perovo"],
];

const SKIP_DIRS = new Set(["node_modules", "dist", "dev-dist", ".git", "coverage"]);

const EXT = /\.(js|jsx|ts|tsx|mjs|json|html|md|mdc|css|sql|txt)$/;

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const fp = path.join(dir, name);
    if (fs.statSync(fp).isDirectory()) walk(fp, out);
    else if (EXT.test(name)) out.push(fp);
  }
  return out;
}

// File renames first
for (const [from, to] of RENAMES) {
  const absFrom = path.join(ROOT, from);
  const absTo = path.join(ROOT, to);
  if (fs.existsSync(absFrom) && !fs.existsSync(absTo)) {
    fs.renameSync(absFrom, absTo);
    console.log(`Renamed ${from} → ${to}`);
  }
}

const files = walk(ROOT).filter((f) => !f.includes("rebrand-perovo-full.mjs"));
let changed = 0;
for (const fp of files) {
  let text = fs.readFileSync(fp, "utf8");
  const orig = text;
  for (const [re, rep] of REPLACEMENTS) {
    text = text.replace(re, rep);
  }
  if (text !== orig) {
    fs.writeFileSync(fp, text);
    changed += 1;
  }
}
console.log(`Updated ${changed} file(s).`);
