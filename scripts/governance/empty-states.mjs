/**
 * Empty-state registry coverage for list screens.
 */
import fs from "fs";
import path from "path";
import { ROOT, SRC, rel } from "../lib/audit-core.mjs";

/** @type {{ page: string, file: string, registryKey?: string, needsGuided?: boolean }[]} */
const LIST_SCREENS = [
  { page: "HomePage", file: "src/ui/features/pages/HomePage.jsx", registryKey: "home-score", needsGuided: true },
  {
    page: "CommitmentsBillsTab",
    file: "src/ui/features/commitments/CommitmentsBillsTab.jsx",
    registryKey: "bills-list",
    needsGuided: true,
  },
  { page: "LendingPage", file: "src/ui/features/pages/LendingPage.jsx", registryKey: "lending-list" },
  { page: "DailySpendPanel", file: "src/ui/features/commitments/DailySpendPanel.jsx", registryKey: "spends-list" },
  { page: "PlanGoalsSection", file: "src/ui/features/plan/PlanGoalsSection.jsx", registryKey: "goals-list" },
];

export function runEmptyStatesAudit() {
  const errors = [];
  const warnings = [];
  const advisories = [];

  const registryPath = path.join(SRC, "constants/guidance/registry/emptyStates.js");
  if (!fs.existsSync(registryPath)) {
    errors.push({ message: "Missing src/constants/guidance/registry/emptyStates.js" });
    return { id: "empty-states", title: "Empty-state registry coverage", errors, warnings, advisories };
  }

  const registryCode = fs.readFileSync(registryPath, "utf8");
  const registeredKeys = [...registryCode.matchAll(/^\s*"([\w-]+)"\s*:/gm)].map((m) => m[1]);

  for (const screen of LIST_SCREENS) {
    const abs = path.join(ROOT, screen.file);
    if (!fs.existsSync(abs)) continue;

    const code = fs.readFileSync(abs, "utf8");
    const hasEmpty =
      code.includes("EmptyState") ||
      code.includes("GuidedEmptyState") ||
      code.includes("getEmptyStateGuidance");

    if (!hasEmpty) {
      warnings.push({
        kind: "missing-empty-ui",
        file: screen.file,
        message: `${screen.page} list screen has no EmptyState / GuidedEmptyState`,
      });
    }

    if (screen.registryKey && !registeredKeys.includes(screen.registryKey)) {
      advisories.push({
        kind: "missing-registry-key",
        file: screen.file,
        message: `Add "${screen.registryKey}" to emptyStates.js for ${screen.page}`,
      });
    }

    if (screen.needsGuided && hasEmpty && !code.includes("GuidedEmptyState") && !code.includes("getEmptyStateGuidance")) {
      advisories.push({
        kind: "generic-empty",
        file: screen.file,
        message: `${screen.page} uses generic EmptyState — prefer GuidedEmptyState with registry key`,
      });
    }

    if (screen.registryKey && registeredKeys.includes(screen.registryKey) && screen.needsGuided) {
      if (!code.includes(screen.registryKey) && !code.includes("GuidedEmptyState")) {
        warnings.push({
          kind: "registry-unused",
          file: screen.file,
          message: `Registry key "${screen.registryKey}" exists but page does not use GuidedEmptyState`,
        });
      }
    }
  }

  for (const pageFile of fs.readdirSync(path.join(SRC, "ui/features/pages")).filter((f) => f.endsWith("Page.jsx"))) {
    const abs = path.join(SRC, "ui/features/pages", pageFile);
    const code = fs.readFileSync(abs, "utf8");
    if (!code.includes("PageShell")) {
      warnings.push({
        kind: "page-shell",
        file: rel(abs),
        message: "Page missing PageShell wrapper",
      });
    }
    if (/title=\{["'][A-Z]/.test(code) || /title=["'][A-Z][a-z]+/.test(code)) {
      warnings.push({
        kind: "hardcoded-title",
        file: rel(abs),
        message: "PageShell title may be hardcoded English — use t()",
      });
    }
  }

  return {
    id: "empty-states",
    title: "Empty-state & page shell coverage",
    errors,
    warnings,
    advisories,
  };
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  const { printReport, exitCode, parseArgs } = await import("../lib/audit-core.mjs");
  const opts = parseArgs();
  const report = runEmptyStatesAudit();
  const s = printReport(report, opts);
  process.exit(exitCode(s, opts.strict));
}
