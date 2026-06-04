/**
 * Design system & UI consistency audit.
 */
import fs from "fs";
import path from "path";
import { ROOT, SRC, UI, rel, walk, printReport, summarize, exitCode, parseArgs } from "../lib/audit-core.mjs";

const HEX_IN_JSX = /#(?:[0-9a-fA-F]{3}){1,2}\b/g;
const TAILWIND_VISUAL =
  /\b(bg|text|border|ring|from|to|shadow|rounded)-(white|gray|slate|indigo|violet|emerald|amber|red|rose|sky|teal|yellow|orange|green|blue|stone)-/;
const RAW_INPUT_CLASS = /const\s+inputClass\s*=/;
const DUPLICATE_SPACING = /\b(px-[34]\s+py-[23]|rounded-xl|rounded-2xl)\b/g;

export function runDesignAudit() {
  const errors = [];
  const warnings = [];
  const advisories = [];

  for (const file of walk(SRC, [], /\.(jsx|js)$/)) {
    const r = rel(file);
    const code = fs.readFileSync(file, "utf8");
    const inUi = r.startsWith("src/ui/");

    // engines may return legacy badge class strings — migrate to ct-* over time (advisory only)
    if (!inUi && !r.startsWith("src/engines/") && TAILWIND_VISUAL.test(code)) {
      const gradientConfig = r.startsWith("src/constants/") && /gradient:\s*["']from-/.test(code);
      const item = {
        kind: "design-bypass",
        file: r,
        message: gradientConfig
          ? "Tailwind gradient tokens in constants — move to ct-* avatar styles when refactoring"
          : "Tailwind visual utilities outside src/ui/ — use ct-* or move UI",
      };
      if (gradientConfig) advisories.push(item);
      else errors.push(item);
    }
    if (r.startsWith("src/engines/") && TAILWIND_VISUAL.test(code)) {
      advisories.push({
        kind: "engine-badge-classes",
        file: r,
        message: "Engine returns Tailwind class strings — prefer ct-badge tokens in UI layer",
      });
    }

    if (!inUi && RAW_INPUT_CLASS.test(code)) {
      warnings.push({
        kind: "raw-input-style",
        file: r,
        message: "Local inputClass styling — use ui primitives or ct-* fields",
      });
    }

    if (inUi && RAW_INPUT_CLASS.test(code)) {
      warnings.push({
        kind: "raw-input-style",
        file: r,
        message: "const inputClass — prefer ct-field / Input primitive",
      });
    }

    const hex = code.match(HEX_IN_JSX);
    if (hex && inUi && !r.includes("tokens.css")) {
      const unique = [...new Set(hex)];
      if (unique.length > 0) {
        advisories.push({
          kind: "hardcoded-color",
          file: r,
          message: `Hardcoded hex in JSX (${unique.slice(0, 3).join(", ")}${unique.length > 3 ? "…" : ""})`,
          detail: "Prefer CSS variables in ui/styles/tokens.css",
        });
      }
    }

    if (inUi) {
      const spacingHits = [...code.matchAll(DUPLICATE_SPACING)].length;
      if (spacingHits >= 8) {
        advisories.push({
          kind: "spacing-drift",
          file: r,
          message: `${spacingHits} inline Tailwind spacing/radius tokens — consider ct-* pattern`,
        });
      }
    }
  }

  const tokensPath = path.join(UI, "styles/tokens.css");
  if (fs.existsSync(tokensPath)) {
    const t = fs.readFileSync(tokensPath, "utf8");
    if (!t.includes("--ct-accent")) {
      warnings.push({ kind: "tokens", message: "tokens.css missing --ct-accent variable" });
    }
  }

  return {
    id: "design",
    title: "Design system & UI consistency",
    errors,
    warnings,
    advisories,
  };
}
