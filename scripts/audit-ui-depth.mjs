#!/usr/bin/env node
/**
 * Deep UI / on-screen audit:
 * - Barrel exports never imported
 * - Pages without routes
 * - UI modules unreachable from App entry
 * - Dashboard tool tiles without modal handlers
 * - Nav links without matching routes
 * - Buttons / FAB / QuickActions in unreachable files
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const UI = path.join(SRC, "ui");
const INDEX = path.join(UI, "index.js");
const JSON_OUT = process.argv.includes("--json");
const LIST = process.argv.includes("--list") || process.argv.includes("--inventory");

const IMPORT_RE = /(?:import|export)\s+(?:[\w*{}\s,]+\s+from\s+)?["']([^"']+)["']/g;
const ROUTE_RE = /<Route\s+[^>]*path=["']([^"']+)["']/g;
const NAV_TO_RE = /to=["']([^"']+)["']/g;
const TOOL_HANDLER_RE = /activeTool\s*===\s*["']([^"']+)["']/g;
const BUTTON_RE = /<(Button|Fab|QuickAction|ToolTile)\b/g;

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

function walk(dir, acc = [], ext = /\.(jsx|js)$/) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === "__tests__") continue;
      walk(p, acc, ext);
    } else if (ext.test(e.name)) acc.push(p);
  }
  return acc;
}

function resolveImport(fromFile, spec) {
  if (!spec.startsWith(".")) return null;
  const base = path.resolve(path.dirname(fromFile), spec);
  for (const suffix of ["", ".js", ".jsx", "/index.js", "/index.jsx"]) {
    const candidate = base + suffix;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function buildReachable(entryFiles) {
  const queue = [...entryFiles].filter((f) => fs.existsSync(f));
  const seen = new Set(queue);
  while (queue.length) {
    const file = queue.shift();
    const code = fs.readFileSync(file, "utf8");
    for (const m of code.matchAll(IMPORT_RE)) {
      const spec = m[1];
      if (!spec.startsWith(".")) continue;
      const resolved = resolveImport(file, spec);
      if (resolved && !seen.has(resolved)) {
        seen.add(resolved);
        queue.push(resolved);
      }
    }
  }
  return seen;
}

function parseBarrelExports() {
  const indexSrc = fs.readFileSync(INDEX, "utf8");
  const names = [];
  for (const m of indexSrc.matchAll(/export\s+\{\s*([^}]+)\s*\}\s+from/g)) {
    for (const part of m[1].split(",")) {
      const named = part.match(/(?:\w+\s+as\s+)?(\w+)/);
      if (named) names.push(named[1]);
    }
  }
  return names.filter((n) => n !== "cn");
}

function findUnusedBarrelExports(srcFiles, exportNames) {
  const unused = [];
  for (const name of exportNames) {
    const re = new RegExp(`\\b${name}\\b`);
    let used = false;
    for (const file of srcFiles) {
      if (file === INDEX) continue;
      if (re.test(fs.readFileSync(file, "utf8"))) {
        used = true;
        break;
      }
    }
    if (!used) unused.push({ kind: "barrel-export", name });
  }
  return unused;
}

function findUnmountedPages() {
  const pageDir = path.join(UI, "features/pages");
  const appSrc = fs.readFileSync(path.join(SRC, "App.jsx"), "utf8");
  const routes = [...appSrc.matchAll(ROUTE_RE)].map((m) => m[1]);
  const items = [];
  if (!fs.existsSync(pageDir)) return items;
  for (const file of fs.readdirSync(pageDir)) {
    if (!file.endsWith("Page.jsx")) continue;
    const base = file.replace(/Page\.jsx$/, "");
    const shell = path.join(SRC, "pages", `${base}.jsx`);
    const routeHit = routes.some(
      (r) => r === `/${base.toLowerCase()}` || r === `/${base}` || r.includes(base.toLowerCase()),
    );
    if (!routeHit && !fs.existsSync(shell)) {
      items.push({ kind: "unmounted-page", file: rel(path.join(pageDir, file)) });
    }
  }
  return items;
}

function findUnreachableUi(reachable) {
  const uiFiles = walk(UI);
  return uiFiles
    .filter((f) => !f.includes("__tests__"))
    .filter((f) => !reachable.has(f))
    .map((f) => ({ kind: "unreachable-ui", file: rel(f) }));
}

function findOrphanToolHandlers() {
  const dashPath = path.join(UI, "features/dashboard/DashboardTools.jsx");
  if (!fs.existsSync(dashPath)) return [];
  const code = fs.readFileSync(dashPath, "utf8");
  const handlers = new Set([...code.matchAll(TOOL_HANDLER_RE)].map((m) => m[1]));
  let modeExp;
  try {
    modeExp = fs.readFileSync(path.join(SRC, "constants/modeExperience.js"), "utf8");
  } catch {
    return [];
  }
  const allIds = new Set([...modeExp.matchAll(/id:\s*["']([^"']+)["']/g)].map((m) => m[1]));
  const orphans = [];
  for (const id of allIds) {
    if (!handlers.has(id)) orphans.push({ kind: "tool-no-handler", id });
  }
  return orphans;
}

function findNavWithoutRoutes() {
  const appSrc = fs.readFileSync(path.join(SRC, "App.jsx"), "utf8");
  const routes = new Set([...appSrc.matchAll(ROUTE_RE)].map((m) => m[1]));
  const navPath = path.join(UI, "layout/Navbar.jsx");
  if (!fs.existsSync(navPath)) return [];
  const navSrc = fs.readFileSync(navPath, "utf8");
  const items = [];
  for (const m of navSrc.matchAll(NAV_TO_RE)) {
    const to = m[1];
    if (!routes.has(to) && to !== "/onboarding") {
      items.push({ kind: "nav-no-route", path: to });
    }
  }
  return items;
}

function findDeadScreenButtons(reachable) {
  const uiFiles = walk(UI);
  const items = [];
  for (const file of uiFiles) {
    if (reachable.has(file)) continue;
    const code = fs.readFileSync(file, "utf8");
    const matches = [...code.matchAll(BUTTON_RE)];
    if (matches.length === 0) continue;
    const byType = {};
    for (const m of matches) {
      byType[m[1]] = (byType[m[1]] || 0) + 1;
    }
    items.push({
      kind: "dead-screen-buttons",
      file: rel(file),
      counts: byType,
      total: matches.length,
    });
  }
  return items;
}

function findExportedFabQuickActionUnused(srcFiles) {
  const checks = [
    { export: "Fab", jsx: /<Fab\b/ },
    { export: "QuickAction", jsx: /<QuickAction\b/ },
    { export: "QuickActionRow", jsx: /<QuickActionRow\b/ },
  ];
  const items = [];
  for (const { export: name, jsx } of checks) {
    let importCount = 0;
    let jsxCount = 0;
    for (const file of srcFiles) {
      const code = fs.readFileSync(file, "utf8");
      if (file === INDEX) continue;
      if (new RegExp(`\\b${name}\\b`).test(code)) importCount += 1;
      if (jsx.test(code)) jsxCount += 1;
    }
    if (importCount > 0 && jsxCount === 0) {
      items.push({ kind: "export-never-rendered", name, note: "imported but never used in JSX" });
    }
    if (importCount === 0) {
      const barrel = fs.readFileSync(INDEX, "utf8");
      if (barrel.includes(name)) items.push({ kind: "barrel-never-imported", name });
    }
  }
  return items;
}

// ── Run ─────────────────────────────────────────────────────────────────────
const srcFiles = walk(SRC);
const entries = [
  path.join(SRC, "main.jsx"),
  path.join(SRC, "App.jsx"),
  ...walk(path.join(SRC, "pages")),
];
const reachable = buildReachable(entries);

const findings = [
  ...findUnusedBarrelExports(srcFiles, parseBarrelExports()),
  ...findUnmountedPages(),
  ...findUnreachableUi(reachable),
  ...findOrphanToolHandlers(),
  ...findNavWithoutRoutes(),
  ...findDeadScreenButtons(reachable),
  ...findExportedFabQuickActionUnused(srcFiles),
];

const summary = {
  total: findings.length,
  barrelExports: findings.filter((f) => f.kind === "barrel-export").map((f) => f.name),
  unmountedPages: findings.filter((f) => f.kind === "unmounted-page"),
  unreachableUi: findings.filter((f) => f.kind === "unreachable-ui"),
  orphanTools: findings.filter((f) => f.kind === "tool-no-handler"),
  navNoRoute: findings.filter((f) => f.kind === "nav-no-route"),
  deadButtons: findings.filter((f) => f.kind === "dead-screen-buttons"),
  exportNeverRendered: findings.filter((f) => f.kind === "export-never-rendered" || f.kind === "barrel-never-imported"),
  items: findings,
};

if (JSON_OUT) {
  console.log(JSON.stringify(summary));
  process.exit(findings.length ? 1 : 0);
}

function printFinding(f) {
  switch (f.kind) {
    case "barrel-export":
      console.log(`  [barrel] ${f.name} — exported from ui/index.js, never imported`);
      break;
    case "unmounted-page":
      console.log(`  [page] ${f.file} — no Route in App.jsx and no src/pages shell`);
      break;
    case "unreachable-ui":
      console.log(`  [dead module] ${f.file} — not reachable from App/pages`);
      break;
    case "tool-no-handler":
      console.log(`  [tool tile] "${f.id}" — in mode tools but no activeTool === "${f.id}" in DashboardTools`);
      break;
    case "nav-no-route":
      console.log(`  [nav link] ${f.path} — Navbar link with no matching <Route>`);
      break;
    case "dead-screen-buttons":
      console.log(
        `  [buttons] ${f.file} — ${f.total} control(s): ${Object.entries(f.counts)
          .map(([k, v]) => `${k}×${v}`)
          .join(", ")} (file not on any screen)`,
      );
      break;
    case "export-never-rendered":
      console.log(`  [control] ${f.name} — ${f.note}`);
      break;
    case "barrel-never-imported":
      console.log(`  [control] ${f.name} — in barrel, never imported anywhere`);
      break;
    default:
      console.log(`  ${JSON.stringify(f)}`);
  }
}

if (process.argv.includes("--inventory")) {
  const wired = [...reachable].filter((f) => f.includes(`${path.sep}ui${path.sep}`));
  let btnTotal = 0;
  const byFile = [];
  for (const file of wired) {
    const code = fs.readFileSync(file, "utf8");
    const m = [...code.matchAll(BUTTON_RE)];
    if (m.length) {
      btnTotal += m.length;
      byFile.push({ file: rel(file), count: m.length });
    }
  }
  console.log("\n── On-screen controls (reachable UI) ──");
  console.log(`  ${btnTotal} Button/Fab/QuickAction/ToolTile in ${byFile.length} file(s)`);
  byFile.sort((a, b) => b.count - a.count).slice(0, 15).forEach((r) => {
    console.log(`    ${r.count}×  ${r.file}`);
  });
  if (byFile.length > 15) console.log(`    … +${byFile.length - 15} more files`);
  console.log("\n── Routes in App.jsx ──");
  const appSrc = fs.readFileSync(path.join(SRC, "App.jsx"), "utf8");
  [...appSrc.matchAll(ROUTE_RE)].forEach((m) => console.log(`    ${m[1]}`));
}

if (LIST || findings.length) {
  console.log(`\nUI depth audit — ${findings.length} issue(s)\n`);
  if (findings.length === 0) console.log("  All screens, tools, nav links, and barrel exports look wired.\n");
  else findings.forEach(printFinding);
}

if (findings.length) process.exit(1);
console.log("UI depth: OK");
process.exit(0);
