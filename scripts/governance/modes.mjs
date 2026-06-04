/**
 * User mode isolation audit.
 */
import fs from "fs";
import path from "path";
import { SRC, rel, walk } from "../lib/audit-core.mjs";
import { MODE_CAPABILITIES, MODE_LOGIC_ALLOWLIST, MODE_IDS } from "../../src/governance/registries/modes.js";

const MODE_ENGINE_IMPORT = {
  modeFamily: "family",
};

export function runModesAudit() {
  const errors = [];
  const warnings = [];
  const advisories = [];

  for (const file of walk(SRC, [], /\.(jsx|js)$/)) {
    const r = rel(file);
    if (r.includes("__tests__") || r.startsWith("src/governance/")) continue;
    const code = fs.readFileSync(file, "utf8");

    const modeLiterals = [...code.matchAll(/mode\s*===?\s*["'](\w+)["']/g)].map((m) => m[1]);
    if (modeLiterals.length && !MODE_LOGIC_ALLOWLIST.some((a) => r.endsWith(a) || r.includes(a))) {
      advisories.push({
        kind: "mode-leak",
        file: r,
        message: `Mode branching (${[...new Set(modeLiterals)].join(", ")}) outside allowlist`,
        detail: "Centralize in modeExperience / dashboard panels",
      });
    }

    for (const [mod, modeId] of Object.entries(MODE_ENGINE_IMPORT)) {
      if (code.includes(`/${mod}`) || code.includes(`${mod}.js`)) {
        const allowed =
          r.includes(`engines/${mod}`) ||
          MODE_LOGIC_ALLOWLIST.some((a) => r.includes(a)) ||
          r.startsWith("src/hooks/");
        if (!allowed) {
          warnings.push({
            kind: "mode-engine-import",
            file: r,
            message: `Imports ${mod} — couples code to "${modeId}" mode engine`,
          });
        }
      }
    }
  }

  for (const modeId of MODE_IDS) {
    if (!MODE_CAPABILITIES[modeId]) {
      errors.push({ kind: "registry", message: `Registry missing mode: ${modeId}` });
    }
  }

  const modeExpPath = path.join(SRC, "constants/modeExperience.js");
  if (fs.existsSync(modeExpPath)) {
    const code = fs.readFileSync(modeExpPath, "utf8");
    for (const modeId of MODE_IDS) {
      if (!code.includes(modeId)) {
        advisories.push({
          kind: "mode-config",
          message: `modeExperience.js has no reference to mode "${modeId}"`,
        });
      }
    }
  }

  return {
    id: "modes",
    title: "User mode isolation",
    errors,
    warnings,
    advisories,
  };
}
