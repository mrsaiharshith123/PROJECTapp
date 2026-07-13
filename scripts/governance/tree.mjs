/**
 * Project file-tree & UI placement audit.
 * Validates: visual UI under src/ui/, allowed shell JSX, expected folders, orphans.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ROOT, SRC, rel, walk, buildReachable, parseArgs } from "../lib/audit-core.mjs";

/** Top-level src layout (docs/02-project-structure.md). */
const REQUIRED_DIRS = [
  "ui",
  "engines",
  "hooks",
  "context",
  "constants",
  "utils",
  "services",
  "app",
  "guidance",
];

const UI_SUBDIRS = ["primitives", "patterns", "features", "layout", "styles", "guidance", "tokens", "dev"];

/** JSX outside ui/ is allowed only here (routing, providers, glue — no product screens). */
const JSX_SHELL_PREFIXES = [
  "src/App.jsx",
  "src/main.jsx",
  "src/main-update-test.jsx",
  "src/renderApp.jsx",
  "src/mountUpdateTestShell.jsx",
  "src/boot/",
  "src/capgo-notify-only.js",
  "src/capgo-notify-update-test-only.js",
  "src/app/",
  "src/context/",
];

const FORBIDDEN_PATHS = [
  "src/components",
  "src/pages",
  "src/screens",
  "src/widgets",
];

const VISUAL_OUTSIDE_UI_RE = [
  /\b(bg|text|border)-(white|gray|slate|indigo|violet|emerald|amber|red|rose)-/,
  /\brounded-(xl|2xl|3xl)\b/,
  /\bdark:(bg|text|border)-/,
];

function isAllowedShellJsx(fileRel) {
  return JSX_SHELL_PREFIXES.some((p) => fileRel === p || fileRel.startsWith(p));
}

function hasVisualMarkup(code) {
  if (VISUAL_OUTSIDE_UI_RE.some((re) => re.test(code))) return true;
  const cls = [...code.matchAll(/className\s*=\s*["'{`]([^"'`]+)/g)].map((m) => m[1]).join(" ");
  return /\b(bg-|text-gray|text-slate|rounded-xl|shadow-lg|border-indigo)\b/.test(cls);
}

function listJsxFiles() {
  return walk(SRC, [], /\.jsx$/).map(rel);
}

function printSrcTree(maxDepth = 3) {
  const lines = [];
  function branch(dir, prefix, depth) {
    if (depth > maxDepth) return;
    const entries = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => !["node_modules", "__tests__"].includes(e.name))
      .sort((a, b) => {
        if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    entries.forEach((e, i) => {
      const last = i === entries.length - 1;
      const connector = last ? "└── " : "├── ";
      const childPrefix = last ? "    " : "│   ";
      const name = e.isDirectory() ? `${e.name}/` : e.name;
      lines.push(`${prefix}${connector}${name}`);
      if (e.isDirectory()) branch(path.join(dir, e.name), prefix + childPrefix, depth + 1);
    });
  }
  lines.push("src/");
  branch(SRC, "", 0);
  return lines;
}

export function runTreeAudit() {
  const errors = [];
  const warnings = [];
  const advisories = [];

  for (const forbidden of FORBIDDEN_PATHS) {
    const full = path.join(ROOT, forbidden);
    if (!fs.existsSync(full)) continue;
    const hasFiles = walk(full, [], () => true).length > 0;
    const finding = {
      kind: "forbidden-folder",
      file: forbidden,
      message: hasFiles
        ? `Migrate files out of "${forbidden}" — screens belong in src/ui/features/pages/`
        : `Remove empty "${forbidden}" (legacy path; use src/ui/features/pages/)`,
    };
    if (hasFiles) errors.push(finding);
    else warnings.push(finding);
  }

  for (const dir of REQUIRED_DIRS) {
    const full = path.join(SRC, dir);
    if (!fs.existsSync(full)) {
      warnings.push({
        kind: "missing-dir",
        message: `Expected src/${dir}/ (see docs/02-project-structure.md)`,
      });
    }
  }

  const uiPath = path.join(SRC, "ui");
  for (const sub of UI_SUBDIRS) {
    if (!fs.existsSync(path.join(uiPath, sub))) {
      advisories.push({
        kind: "ui-subdir",
        message: `src/ui/${sub}/ missing — design system may be incomplete`,
      });
    }
  }

  const jsxFiles = listJsxFiles();
  const inUi = jsxFiles.filter((f) => f.startsWith("src/ui/"));
  const outsideUi = jsxFiles.filter((f) => !f.startsWith("src/ui/"));

  for (const fileRel of outsideUi) {
    if (!isAllowedShellJsx(fileRel)) {
      errors.push({
        kind: "jsx-outside-ui",
        file: fileRel,
        message: "Product JSX must live under src/ui/ (move screen/widget here)",
      });
      continue;
    }
    const code = fs.readFileSync(path.join(ROOT, fileRel), "utf8");
    if (hasVisualMarkup(code) && !/className\s*=\s*["'`][^"'`]*ct-/.test(code)) {
      warnings.push({
        kind: "shell-visual",
        file: fileRel,
        message: "Shell file uses non-ct styling — keep layout in src/ui/, wire from App.jsx",
      });
    }
  }

  const entry = [
    path.join(SRC, "main.jsx"),
    path.join(SRC, "App.jsx"),
    ...walk(path.join(SRC, "app"), [], /\.jsx$/),
  ].filter((f) => fs.existsSync(f));
  const reachable = buildReachable(entry);
  const reachableRel = new Set([...reachable].map(rel));

  const orphanUi = inUi.filter((f) => {
    const full = path.join(ROOT, f);
    return !reachableRel.has(f) && !f.includes("ErrorBoundary");
  });

  for (const fileRel of orphanUi.slice(0, 15)) {
    warnings.push({
      kind: "orphan-ui",
      file: fileRel,
      message: "UI module not reachable from App.jsx — remove or wire route/import",
    });
  }
  if (orphanUi.length > 15) {
    advisories.push({
      kind: "orphan-ui-batch",
      message: `${orphanUi.length - 15} more unreachable UI file(s) — run npm run audit:tree --tree`,
    });
  }

  const enginesJsx = walk(path.join(SRC, "engines"), [], /\.jsx$/);
  if (enginesJsx.length) {
    errors.push({
      kind: "engines-jsx",
      message: `${enginesJsx.length} JSX file(s) in engines/ — logic must stay .js`,
      detail: enginesJsx.map(rel).join(", "),
    });
  }

  const suggestions = [
    "Visual UI: src/ui/{primitives,patterns,features,layout,guidance,styles}",
    "Screens: src/ui/features/pages/* + lazy route in App.jsx",
    "Glue only: src/app/* (sync, theme, redirects) — return null or ct-* loader",
    "Logic: src/engines/*.js + src/constants/guidance/*.js (no JSX)",
    "Audits: npm run audit:ui · audit:ui-depth · audit:tree · audit:governance",
  ];

  if (outsideUi.length > 8) {
    advisories.push({
      kind: "shell-count",
      message: `${outsideUi.length} shell JSX files — keep new screens out of app/ and context/`,
    });
  }

  return {
    id: "tree",
    title: "Project file tree & UI placement",
    errors,
    warnings,
    advisories,
    meta: {
      jsxInUi: inUi.length,
      jsxShell: outsideUi.length,
      shellFiles: outsideUi,
      orphanUi: orphanUi.length,
      suggestions,
      treeLines: printSrcTree(3),
    },
  };
}

function main() {
  const opts = parseArgs();
  const showTree = process.argv.includes("--tree");
  const report = runTreeAudit();
  const { meta } = report;

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.errors?.length ? 1 : 0);
  }

  const e = report.errors?.length || 0;
  const w = report.warnings?.length || 0;
  const a = report.advisories?.length || 0;

  console.log("\nProject tree & UI placement\n");
  console.log(`  Visual JSX: ${meta.jsxInUi} under src/ui/`);
  console.log(`  Shell JSX:  ${meta.jsxShell} (App, main, app/, context/)`);
  if (meta.orphanUi > 0) console.log(`  Orphan UI:  ${meta.orphanUi} not reachable from App.jsx`);
  console.log(`  Status:     ${e ? "FAIL" : w ? "REVIEW" : "OK"} — ${e} error(s), ${w} warning(s), ${a} advisory(ies)\n`);

  if (showTree) {
    console.log("src/ tree (depth 3):\n");
    meta.treeLines.forEach((line) => console.log(`  ${line}`));
    console.log("");
  }

  console.log("Recommended layout:\n");
  meta.suggestions.forEach((s) => console.log(`  • ${s}`));
  console.log("");

  for (const x of [...report.errors, ...report.warnings].slice(0, 20)) {
    console.log(`  [${x.kind}] ${x.file || ""} ${x.message}`.trim());
    if (x.detail) console.log(`           ${x.detail}`);
  }
  if ((report.errors?.length || 0) + (report.warnings?.length || 0) > 20) {
    console.log("  … see npm run audit:tree --json\n");
  }

  process.exit(e ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
