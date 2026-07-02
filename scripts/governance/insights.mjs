/**
 * Insight engine overlap & severity consistency audit.
 */
import fs from "fs";
import path from "path";
import { ROOT, SRC, rel, walk } from "../lib/audit-core.mjs";
import { INSIGHT_PRODUCERS, INSIGHT_TONES } from "../registries/insights.mjs";

const INSIGHT_FN_RE = /export\s+function\s+(build\w*Insight\w*|generate\w*Insight\w*|\w*Insights)\s*\(/g;

export function runInsightsAudit() {
  const errors = [];
  const warnings = [];
  const advisories = [];

  const producers = [];
  for (const file of walk(path.join(SRC, "engines"), [], /\.js$/)) {
    const r = rel(file);
    const code = fs.readFileSync(file, "utf8");
    const fns = [...code.matchAll(INSIGHT_FN_RE)].map((m) => m[1]);
    if (fns.length) producers.push({ file: r, fns });
    const tones = INSIGHT_TONES.filter((t) => code.includes(`"${t}"`) || code.includes(`'${t}'`));
    if (tones.length >= 4) {
      advisories.push({
        kind: "tone-sprawl",
        file: r,
        message: `Many tone literals (${tones.join(", ")}) — align with INSIGHT_TONES registry`,
      });
    }
  }

  if (producers.length > 6) {
    warnings.push({
      kind: "insight-proliferation",
      message: `${producers.length} engine files export insight builders`,
      detail: producers.map((p) => p.file).slice(0, 4).join(", "),
    });
  }

  for (const reg of INSIGHT_PRODUCERS) {
    const full = path.join(ROOT, "src", reg.path);
    if (!fs.existsSync(full)) {
      advisories.push({
        kind: "registry-drift",
        message: `Insight registry path missing: ${reg.path}`,
      });
    }
  }

  const notif = path.join(SRC, "engines/notifications.js");
  const intel = path.join(SRC, "engines/intelligence.js");
  if (fs.existsSync(notif) && fs.existsSync(intel)) {
    const n = fs.readFileSync(notif, "utf8");
    const i = fs.readFileSync(intel, "utf8");
    if (n.includes("critical") && i.includes("critical") && n.includes("warning") && i.includes("warning")) {
      advisories.push({
        kind: "severity-overlap",
        message: "notifications + intelligence both map critical/warning — keep severity semantics aligned",
      });
    }
  }

  return {
    id: "insights",
    title: "Insight engine governance",
    errors,
    warnings,
    advisories,
  };
}
