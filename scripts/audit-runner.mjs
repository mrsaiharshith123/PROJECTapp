#!/usr/bin/env node
/**
 * Governance audit runner.
 *
 *   npm run audit:list
 *   npm run audit:governance          # built-in governance checks only
 *   npm run audit:governance:full     # + UI/styles/depth/merge (no duplicate code pass)
 *   npm run audit:governance:quick
 *   node scripts/audit-runner.mjs design --json --verbose
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { ROOT, parseArgs, summarize } from "./lib/audit-core.mjs";
import { runDesignAudit } from "./governance/design.mjs";
import { runArchitectureAudit } from "./governance/architecture.mjs";
import { runFeaturesAudit } from "./governance/features.mjs";
import { runModesAudit } from "./governance/modes.mjs";
import { runInsightsAudit } from "./governance/insights.mjs";
import { runPerformanceAudit } from "./governance/performance.mjs";
import { runMobileAudit } from "./governance/mobile.mjs";
import { runNativeShellsAudit } from "./governance/native-shells.mjs";
import { runDuplicatesAudit } from "./governance/duplicates.mjs";
import { runSyncAudit } from "./governance/sync.mjs";
import { runGuidanceAudit } from "./governance/guidance.mjs";
import { runTreeAudit } from "./governance/tree.mjs";
import { runTransactionsAudit } from "./governance/transactions.mjs";
import { runA11yAudit } from "./governance/a11y.mjs";
import { runThemeAudit } from "./governance/theme.mjs";
import { runEmptyStatesAudit } from "./governance/empty-states.mjs";
import { runPwaAudit } from "./governance/pwa.mjs";
import { runCleanupAudit } from "./governance/cleanup.mjs";
import { runSecurityAudit } from "./governance/security.mjs";
import { runTestingAudit } from "./governance/testing.mjs";
import { runBusinessLogicAudit } from "./governance/business-logic.mjs";
import { runRefactoringAudit } from "./governance/refactoring.mjs";
import { runDevopsAudit } from "./governance/devops.mjs";
import { runDatabaseAudit } from "./governance/database.mjs";
import { runContextAudit } from "./governance/context.mjs";
import { runDependenciesAudit } from "./governance/dependencies.mjs";
import { runErrorHandlingAudit } from "./governance/error-handling.mjs";
import { runUxFlowAudit } from "./governance/ux-flow.mjs";

/** @type {{ id: string, label: string, group: string, quick: boolean, fn?: () => object, script?: string }[]} */
const GOVERNANCE = [
  { id: "design", label: "Design system & consistency", group: "frontend", quick: true, fn: runDesignAudit },
  { id: "architecture", label: "Architecture health", group: "platform", quick: true, fn: runArchitectureAudit },
  { id: "features", label: "Feature dependencies", group: "platform", quick: true, fn: runFeaturesAudit },
  { id: "modes", label: "User mode isolation", group: "product", quick: true, fn: runModesAudit },
  { id: "insights", label: "Insight engines", group: "product", quick: false, fn: runInsightsAudit },
  { id: "transactions", label: "Transaction intelligence", group: "product", quick: true, fn: runTransactionsAudit },
  { id: "performance", label: "Performance heuristics", group: "frontend", quick: false, fn: runPerformanceAudit },
  { id: "mobile", label: "Mobile, responsive & device resize", group: "frontend", quick: true, fn: runMobileAudit },
  { id: "pwa", label: "PWA, viewport & safe-area", group: "frontend", quick: true, fn: runPwaAudit },
  { id: "a11y", label: "Accessibility (ARIA, labels)", group: "frontend", quick: true, fn: runA11yAudit },
  { id: "theme", label: "Light/dark theme tokens", group: "frontend", quick: true, fn: runThemeAudit },
  { id: "empty-states", label: "Empty-state & page shells", group: "product", quick: true, fn: runEmptyStatesAudit },
  { id: "cleanup", label: "Stale files & ghost folders", group: "platform", quick: true, fn: runCleanupAudit },
  { id: "native-shells", label: "TWA & Capacitor shells", group: "platform", quick: true, fn: runNativeShellsAudit },
  { id: "duplicates", label: "Duplicate & similar UI", group: "frontend", quick: false, fn: runDuplicatesAudit },
  { id: "sync", label: "Local-first & cloud sync", group: "platform", quick: true, fn: runSyncAudit },
  { id: "guidance", label: "Financial guidance & education", group: "product", quick: true, fn: runGuidanceAudit },
  { id: "tree", label: "File tree & UI placement", group: "platform", quick: true, fn: runTreeAudit },
  { id: "security", label: "Security (XSS, secrets, auth)", group: "platform", quick: true, fn: runSecurityAudit },
  { id: "testing", label: "Test coverage & QA discipline", group: "quality", quick: true, fn: runTestingAudit },
  { id: "business-logic", label: "Financial engine correctness", group: "quality", quick: false, fn: runBusinessLogicAudit },
  { id: "refactoring", label: "Refactoring & duplicate code", group: "platform", quick: false, fn: runRefactoringAudit },
  { id: "devops", label: "DevOps, build & CI/CD", group: "platform", quick: true, fn: runDevopsAudit },
  { id: "database", label: "Database schema, RLS & migrations", group: "platform", quick: true, fn: runDatabaseAudit },
  { id: "context", label: "React context & state management", group: "frontend", quick: false, fn: runContextAudit },
  { id: "dependencies", label: "Bundle size & dependency health", group: "platform", quick: false, fn: runDependenciesAudit },
  { id: "error-handling", label: "Error handling & reliability", group: "quality", quick: false, fn: runErrorHandlingAudit },
  { id: "ux-flow", label: "UX flow & user journey quality", group: "product", quick: true, fn: runUxFlowAudit },
];

const LEGACY = [
  { id: "ui", label: "UI layout (ct-* / src/ui)", group: "legacy", quick: true, script: "scripts/audit-ui.mjs" },
  { id: "styles", label: "CSS & tokens", group: "legacy", quick: true, script: "scripts/audit-styles.mjs" },
  { id: "ui-depth", label: "Screens, nav, dead buttons", group: "legacy", quick: true, script: "scripts/audit-ui-depth.mjs" },
  { id: "merge", label: "Merge suggestions", group: "legacy", quick: true, script: "scripts/audit-merge-suggestions.mjs" },
  { id: "orphans", label: "Test-only production modules", group: "legacy", quick: true, script: "scripts/audit-orphan-modules.mjs" },
  { id: "tier", label: "Subscription tier gates", group: "legacy", quick: true, script: "scripts/audit-tier-gates.mjs" },
];

/** Full lint/knip — use npm run audit:code (not bundled in governance to avoid duplicate failures) */
const STANDALONE = [
  { id: "code", label: "ESLint, Knip, hygiene", group: "standalone", quick: false, script: "scripts/audit-code.mjs" },
];

const REGISTRY = [...GOVERNANCE, ...LEGACY, ...STANDALONE];

function runLegacy(entry, opts) {
  const args = [entry.script, "--json"];
  if (opts.quiet) args.push("--quiet");
  const r = spawnSync("node", args, {
    cwd: ROOT,
    encoding: "utf8",
    shell: true,
    maxBuffer: 20 * 1024 * 1024,
  });
  let data = {};
  try {
    data = JSON.parse((r.stdout || "").trim() || "{}");
  } catch {
    return {
      id: entry.id,
      title: entry.label,
      errors: [{ message: "Failed to parse audit JSON" }],
      warnings: [],
      advisories: [],
    };
  }

  if (entry.id === "ui") {
    const errN = (data.violations || 0) + (data.duplicateReexports || 0);
    return {
      id: entry.id,
      title: entry.label,
      errors: errN ? [{ message: `${errN} UI layout violation(s)` }] : [],
      warnings: [],
      advisories: [],
    };
  }
  if (entry.id === "styles") {
    return {
      id: entry.id,
      title: entry.label,
      errors: (data.errorItems || []).map((e) => ({ message: e.message, file: e.file })),
      warnings: (data.warningItems || []).map((w) => ({ message: w.message, file: w.file })),
      advisories: [],
    };
  }
  if (entry.id === "merge") {
    return {
      id: entry.id,
      title: entry.label,
      errors: [],
      warnings: [],
      advisories: (data.items || []).map((i) => ({
        message: i.from?.length ? `Merge → ${i.into}` : String(i.into),
        detail: i.reason,
      })),
    };
  }
  if (entry.id === "orphans") {
    const items = data.items || [];
    return {
      id: entry.id,
      title: entry.label,
      errors: [],
      warnings: items.map((i) => ({ message: i.file, detail: "Only imported from tests" })),
      advisories: [],
    };
  }
  if (entry.id === "tier") {
    const items = data.items || [];
    return {
      id: entry.id,
      title: entry.label,
      errors: items.length ? items.map((id) => ({ message: `Ungated feature: ${id}` })) : [],
      warnings: [],
      advisories: [],
    };
  }
  if (entry.id === "ui-depth") {
    const items = data.items || [];
    return {
      id: entry.id,
      title: entry.label,
      errors: items
        .filter((i) => i.kind === "barrel-export")
        .map((i) => ({ message: i.name || i.file, file: i.file })),
      warnings: items
        .filter((i) => i.kind !== "barrel-export")
        .map((i) => ({ message: i.file || i.id, detail: i.kind })),
      advisories: [],
    };
  }
  if (entry.id === "code") {
    return {
      id: entry.id,
      title: entry.label,
      errors: (data.errorItems || []).map((e) => ({
        message: e.message,
        file: e.detail || e.category,
      })),
      warnings: (data.warningItems || []).map((w) => ({ message: w.message })),
      advisories: [],
    };
  }
  return { id: entry.id, title: entry.label, errors: [], warnings: [], advisories: [] };
}

function runOne(entry, opts) {
  if (entry.fn) return entry.fn();
  if (entry.script) return runLegacy(entry, opts);
  return { id: entry.id, title: entry.label, errors: [], warnings: [], advisories: [] };
}

function dedupeReports(reports) {
  const byId = new Map();
  for (const r of reports) {
    const prev = byId.get(r.id);
    if (!prev || (r.errors?.length || 0) >= (prev.errors?.length || 0)) byId.set(r.id, r);
  }
  return [...byId.values()];
}

const opts = parseArgs();
const argv = process.argv.slice(2);
const positional = argv.filter((a) => !a.startsWith("--"));
const withLegacy = argv.includes("--with-legacy") || argv.includes("--full");
const govOnly = argv.includes("--gov") || argv.includes("--all") || positional.includes("--gov");

let selected = REGISTRY;
if (opts.quick) selected = selected.filter((e) => e.quick);
if (opts.category) selected = selected.filter((e) => e.group === opts.category);
if (govOnly && !withLegacy && positional.length <= 1) selected = GOVERNANCE;
else if (withLegacy) selected = [...GOVERNANCE, ...LEGACY];
if (positional.length && !positional.some((p) => ["--gov", "--all", "--full"].includes(p))) {
  selected = REGISTRY.filter((e) => positional.includes(e.id));
  if (!selected.length) {
    console.error(`Unknown audit id(s): ${positional.join(", ")} — use npm run audit:list`);
    process.exit(1);
  }
}

const reports = dedupeReports(selected.map((e) => runOne(e, opts)));
const combined = {
  generatedAt: new Date().toISOString(),
  mode: opts.quick ? "quick" : withLegacy ? "governance+legacy" : "governance",
  audits: reports.map((r) => summarize(r)),
  totals: { errors: 0, warnings: 0, advisories: 0 },
};

for (const s of combined.audits) {
  combined.totals.errors += s.errors;
  combined.totals.warnings += s.warnings;
  combined.totals.advisories += s.advisories;
}

if (opts.list && positional.length === 0) {
  console.log("\nPerovo audit registry\n");
  for (const g of ["frontend", "platform", "product", "legacy", "standalone"]) {
    const items = REGISTRY.filter((x) => x.group === g);
    if (!items.length) continue;
    console.log(`  ${g}:`);
    for (const e of items) {
      console.log(`    ${e.id.padEnd(14)} ${e.label}${e.quick ? " (quick)" : ""}`);
    }
  }
  console.log("\nCommands:");
  console.log("  npm run audit              Production gate (tests, build, code, deps)");
  console.log("  npm run audit:governance   Governance checks only");
  console.log("  npm run audit:governance:full  + UI/CSS/depth/merge");
  console.log("  npm run audit:code         ESLint + Knip");
  console.log("  npm run audit:report       JSON → reports/governance-latest.json\n");
  process.exit(0);
}

const showDetails = opts.verbose || combined.totals.errors > 0;

if (opts.json) {
  console.log(JSON.stringify({ ...combined, reports }, null, 2));
} else {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║        PEROVO — GOVERNANCE AUDITS                ║");
  console.log("╚══════════════════════════════════════════════════╝\n");
  for (const r of reports) {
    const s = summarize(r);
    const tag = s.errors ? "FAIL" : s.warnings ? "WARN" : "PASS";
    console.log(`  [${tag}] ${r.title} — ${s.errors}e / ${s.warnings}w / ${s.advisories}a`);
    if (showDetails || s.warnings) {
      const items = [...r.errors, ...r.warnings].slice(0, opts.verbose ? 12 : 4);
      for (const item of items) {
        console.log(`         ↳ ${item.file ? `${item.file}: ` : ""}${item.message}`);
      }
      if (!opts.verbose && s.warnings + s.errors > items.length) {
        console.log(`         ↳ … +${s.warnings + s.errors - items.length} more (use --verbose)`);
      }
    }
  }
  console.log(
    `\n  Totals: ${combined.totals.errors} error(s), ${combined.totals.warnings} warning(s), ${combined.totals.advisories} advisory(s)`,
  );
  if (combined.totals.errors === 0 && combined.totals.warnings > 0) {
    console.log(paintDim("  Tip: warnings are OK for daily work — fix before release or use --strict"));
  }
  console.log("");
}

if (opts.json && process.env.AUDIT_REPORT_PATH) {
  fs.mkdirSync(path.dirname(process.env.AUDIT_REPORT_PATH), { recursive: true });
  fs.writeFileSync(process.env.AUDIT_REPORT_PATH, JSON.stringify({ ...combined, reports }, null, 2));
}

const code =
  combined.totals.errors > 0 ? 1 : opts.strict && combined.totals.warnings > 0 ? 1 : 0;
process.exit(code);

function paintDim(t) {
  return `\x1b[2m${t}\x1b[0m`;
}
