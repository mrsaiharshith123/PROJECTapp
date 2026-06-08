/**
 * Architecture health: layer boundaries, file size, import direction.
 */
import fs from "fs";
import path from "path";
import { SRC, rel, walk, printReport, exitCode, parseArgs } from "../lib/audit-core.mjs";

const MAX_LINES_WARN = 350;
const MAX_LINES_ERROR = 550;

export function runArchitectureAudit() {
  const errors = [];
  const warnings = [];
  const advisories = [];

  const SIZE_SKIP = /src\/(?:i18n\/messages\/|utils\/migrateStorage\.js$)/;

  for (const file of walk(SRC, [], /\.(jsx|js)$/)) {
    const r = rel(file);
    if (SIZE_SKIP.test(r.replace(/\\/g, "/"))) continue;
    const lines = fs.readFileSync(file, "utf8").split("\n").length;
    if (lines >= MAX_LINES_ERROR) {
      warnings.push({
        kind: "giant-file",
        file: r,
        message: `Large module (${lines} lines) — split by concern`,
        detail: "Target <350 lines per file",
      });
    } else if (lines >= MAX_LINES_WARN) {
      advisories.push({
        kind: "large-file",
        file: r,
        message: `${lines} lines — consider extracting hooks or subcomponents`,
      });
    }

    const code = fs.readFileSync(file, "utf8");
    if (r.startsWith("src/engines/") && /from\s+["'][^"']*\/ui\//.test(code)) {
      errors.push({
        kind: "layer-violation",
        file: r,
        message: "engines/ must not import from ui/",
      });
    }
    if (r.startsWith("src/ui/") && /from\s+["'][^"']*\/engines\//.test(code)) {
      const engineImports = [...code.matchAll(/from\s+["']([^"']*engines\/[^"']+)["']/g)];
      if (engineImports.length > 5) {
        advisories.push({
          kind: "ui-engine-coupling",
          file: r,
          message: `${engineImports.length} direct engine imports — prefer hooks layer`,
        });
      }
    }
    if (r.startsWith("src/constants/") && /from\s+["'][^"']*\/(ui|hooks)\//.test(code)) {
      errors.push({
        kind: "layer-violation",
        file: r,
        message: "constants/ must not import ui/ or hooks/",
      });
    }
  }

  const uiDepth = walk(path.join(SRC, "ui/features"), [], /\.jsx$/).map(rel);
  const deepPaths = uiDepth.filter((p) => p.split("/").length > 6);
  if (deepPaths.length > 0) {
    advisories.push({
      kind: "nesting",
      message: `${deepPaths.length} UI file(s) deeply nested — flatten features/* when possible`,
      detail: deepPaths.slice(0, 3).join(", "),
    });
  }

  return {
    id: "architecture",
    title: "Architecture health",
    errors,
    warnings,
    advisories,
  };
}
