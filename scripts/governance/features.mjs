/**
 * Feature dependency & cross-feature coupling audit.
 */
import fs from "fs";
import path from "path";
import { SRC, rel, walk, importSpecsFromFile, resolveImport } from "../lib/audit-core.mjs";
import { FEATURES } from "../../src/governance/registries/features.js";

function featureFromPath(r) {
  const m = r.match(/^src\/ui\/features\/([^/]+)/);
  return m ? m[1] : null;
}

export function runFeaturesAudit() {
  const errors = [];
  const warnings = [];
  const advisories = [];

  for (const feat of FEATURES) {
    for (const prefix of feat.ui) {
      const full = prefix.endsWith("/") ? prefix : prefix;
      const exists = walk(SRC, [], /\.(jsx|js)$/).some((f) => rel(f).startsWith(`src/${full}`) || rel(f) === `src/${full}`);
      if (!exists && !full.endsWith("/")) {
        advisories.push({
          kind: "registry-drift",
          message: `Feature "${feat.id}" registry path missing: ${full}`,
        });
      }
    }
  }

  for (const file of walk(path.join(SRC, "ui/features"), [], /\.(jsx|js)$/)) {
    const r = rel(file);
    const fromFeat = featureFromPath(r);
    if (!fromFeat || fromFeat === "pages" || fromFeat === "auth") continue;
    const code = fs.readFileSync(file, "utf8");
    for (const spec of importSpecsFromFile(file)) {
      const resolved = resolveImport(file, spec);
      if (!resolved) continue;
      const target = rel(resolved);
      const toFeat = featureFromPath(target);
      if (toFeat && toFeat !== fromFeat && toFeat !== "pages" && !spec.includes("../primitives")) {
        advisories.push({
          kind: "cross-feature",
          file: r,
          message: `Imports ${target} from feature "${toFeat}"`,
          detail: `Keep ${fromFeat} isolated — lift shared UI to primitives/patterns`,
        });
      }
    }
  }

  for (const file of walk(path.join(SRC, "hooks"), [], /\.(jsx|js)$/)) {
    const r = rel(file);
    const code = fs.readFileSync(file, "utf8");
    if (/from\s+["'][^"']*\/ui\/features\//.test(code)) {
      errors.push({
        kind: "layer-violation",
        file: r,
        message: "hooks/ should not import ui/features/ directly",
      });
    }
  }

  return {
    id: "features",
    title: "Feature dependency governance",
    errors,
    warnings,
    advisories,
  };
}
