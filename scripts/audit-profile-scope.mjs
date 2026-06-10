#!/usr/bin/env node
/**
 * activeProfileId must filter commitments, lendings, goals, spends in context.
 *   npm run audit:profile-scope
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CTX = path.join(ROOT, "src/context/CommitTrackContext.jsx");
const CRUD = path.join(ROOT, "src/context/useCommitTrackCrud.js");
const JSON_OUT = process.argv.includes("--json");

function main() {
  const ctx = fs.readFileSync(CTX, "utf8");
  const crud = fs.readFileSync(CRUD, "utf8");
  const hits = [];

  const filters = [
    { label: "commitments", fn: "filterByProfile" },
    { label: "lendings", fn: "filterByProfile" },
    { label: "goals", fn: "filterByProfile" },
    { label: "dailySpends", fn: "filterDailySpendsByProfile" },
  ];

  for (const f of filters) {
    if (!ctx.includes(f.fn)) {
      hits.push({ note: `CommitTrackContext missing ${f.fn} for ${f.label}` });
    }
  }

  for (const entity of ["profileId: raw.profileId", "settings.activeProfileId"]) {
    if (!crud.includes("profileId")) {
      hits.push({ note: "useCommitTrackCrud should set profileId on new records" });
      break;
    }
  }

  if (JSON_OUT) {
    console.log(JSON.stringify({ total: hits.length, items: hits }));
    process.exit(hits.length ? 1 : 0);
  }

  if (!hits.length) {
    console.log("Profile scope: context filters and CRUD profileId wiring OK.");
    process.exit(0);
  }

  console.log(`Profile scope — ${hits.length} issue(s):\n`);
  hits.forEach((h) => console.log(`  • ${h.note}`));
  process.exit(1);
}

main();
