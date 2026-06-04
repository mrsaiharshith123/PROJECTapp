/**
 * Performance & complexity audit (static heuristics).
 */
import fs from "fs";
import { SRC, rel, walk } from "../lib/audit-core.mjs";

export function runPerformanceAudit() {
  const errors = [];
  const warnings = [];
  const advisories = [];

  let rechartsImports = 0;
  let heavyPages = 0;

  for (const file of walk(SRC, [], /\.(jsx|js)$/)) {
    const r = rel(file);
    const code = fs.readFileSync(file, "utf8");
    const lines = code.split("\n").length;

    if (code.includes("recharts")) rechartsImports += 1;

    if (r.endsWith("Page.jsx") && lines > 280) {
      heavyPages += 1;
      warnings.push({
        kind: "heavy-page",
        file: r,
        message: `Page component ${lines} lines — extract sections to features/*`,
      });
    }

    const hookCount = (code.match(/\buseEffect\s*\(/g) || []).length;
    const memoCount = (code.match(/\buseMemo\s*\(/g) || []).length;
    if (hookCount >= 6 && memoCount < 2 && r.includes("ui/features")) {
      advisories.push({
        kind: "rerender-risk",
        file: r,
        message: `${hookCount} useEffect(s) with little memoization — review deps`,
      });
    }

    const mapInRender = (code.match(/\.map\s*\(\s*\([^)]*\)\s*=>\s*\(/g) || []).length;
    if (mapInRender >= 12 && lines > 200) {
      advisories.push({
        kind: "render-weight",
        file: r,
        message: "Many inline .map renders — consider list subcomponents",
      });
    }
  }

  if (rechartsImports > 4) {
    advisories.push({
      kind: "charts",
      message: `${rechartsImports} files import recharts — lazy-load chart panels where possible`,
    });
  }

  return {
    id: "performance",
    title: "Performance & complexity",
    errors,
    warnings,
    advisories,
  };
}
