/**
 * Duplicate component / module detection (heuristic).
 */
import fs from "fs";
import path from "path";
import { SRC, rel, walk } from "../lib/audit-core.mjs";

function normalizeSnippet(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/\s+/g, " ")
    .slice(0, 400);
}

export function runDuplicatesAudit() {
  const errors = [];
  const warnings = [];
  const advisories = [];

  const byBase = new Map();
  for (const file of walk(SRC, [], /\.(jsx|js)$/)) {
    const r = rel(file);
    if (r.startsWith("scripts/registries/")) continue;
    const base = path.basename(file);
    if (!byBase.has(base)) byBase.set(base, []);
    byBase.get(base).push(r);
  }
  for (const [base, paths] of byBase) {
    if (paths.length < 2 || base.startsWith("index")) continue;
    const enginesOnly = paths.every((p) => p.startsWith("src/engines/"));
    const splitEngineUtil =
      paths.length === 2 &&
      paths.some((p) => p.startsWith("src/engines/")) &&
      paths.some((p) => p.startsWith("src/constants/") || p.startsWith("src/utils/"));
    if (enginesOnly || splitEngineUtil) continue;
    warnings.push({
      kind: "duplicate-name",
      message: `Same filename "${base}" in ${paths.length} places`,
      detail: paths.join(", "),
    });
  }

  const uiFiles = walk(path.join(SRC, "ui/features"), [], /\.jsx$/);
  const hashes = new Map();
  for (const file of uiFiles) {
    const snippet = normalizeSnippet(fs.readFileSync(file, "utf8"));
    if (snippet.length < 120) continue;
    const key = snippet;
    if (!hashes.has(key)) hashes.set(key, []);
    hashes.get(key).push(rel(file));
  }
  for (const paths of hashes.values()) {
    if (paths.length >= 2) {
      advisories.push({
        kind: "similar-component",
        message: "Nearly identical JSX structure in multiple files",
        detail: paths.join(" ≈ "),
      });
    }
  }

  const cardLike = uiFiles.filter((f) => /Card|Panel|Section/.test(path.basename(f)));
  if (cardLike.length > 18) {
    advisories.push({
      kind: "card-sprawl",
      message: `${cardLike.length} Card/Panel/Section components — consolidate patterns in ui/patterns`,
    });
  }

  return {
    id: "duplicates",
    title: "Duplicate & similar UI detection",
    errors,
    warnings,
    advisories,
  };
}
