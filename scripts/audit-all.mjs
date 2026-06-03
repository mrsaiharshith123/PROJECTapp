#!/usr/bin/env node
/**
 * CommitTrack — single full-project audit (only command you need).
 *
 *   npm run audit
 *   npm run audit -- --strict   # warnings on UI/code/styles/tests/env also fail (not bundle size)
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const STRICT = args.includes("--strict");

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

function paint(color, text) {
  return `${color}${text}${C.reset}`;
}

function runQuiet(label, command, cmdArgs) {
  process.stdout.write(`  ${paint(C.dim, "…")} ${label}${" ".repeat(Math.max(1, 44 - label.length))}`);
  const r = spawnSync(command, cmdArgs, {
    cwd: ROOT,
    encoding: "utf8",
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 30 * 1024 * 1024,
  });
  const ok = r.status === 0;
  process.stdout.write(ok ? paint(C.green, "PASS\n") : paint(C.red, "FAIL\n"));
  return { ok, out: `${r.stdout || ""}\n${r.stderr || ""}`, status: r.status ?? 1 };
}

function parseJson(stdout) {
  const t = (stdout || "").trim();
  if (!t) return null;
  try {
    return JSON.parse(t);
  } catch {
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(t.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

/** @type {{ id: string, label: string, errors: number, warnings: number, ok: boolean, notes: string[], strictBlocks: boolean }[]} */
const sections = [];

function record(id, label, errors, warnings, ok, notes = [], strictBlocks = true) {
  sections.push({ id, label, errors, warnings, ok, notes, strictBlocks });
}

function parseVitestOutput(out) {
  const plain = (out || "").replace(/\x1b\[[0-9;]*m/g, "");
  const tests =
    plain.match(/^\s*Tests\s+(\d+)\s+passed/im)?.[1] ||
    plain.match(/Tests\s+(\d+)\s+passed/i)?.[1];
  const failed =
    plain.match(/^\s*Tests\s+(\d+)\s+failed/im)?.[1] ||
    plain.match(/Tests\s+(\d+)\s+failed/i)?.[1];
  const files =
    plain.match(/^\s*Test Files\s+(\d+)\s+passed/im)?.[1] ||
    plain.match(/Test Files\s+(\d+)\s+passed/i)?.[1];
  let passed = tests ? Number(tests) : 0;
  if (!passed && files && !failed) {
    const perFile = [...plain.matchAll(/✓[^\n]*\((\d+)\s+tests?\)/gi)];
    if (perFile.length) passed = perFile.reduce((s, m) => s + Number(m[1]), 0);
  }
  return {
    passed,
    failed: failed ? Number(failed) : 0,
    files: files ? Number(files) : null,
  };
}

function checkEnvHygiene() {
  const notes = [];
  let errors = 0;
  let warnings = 0;
  const envPath = path.join(ROOT, ".env");
  const examplePath = path.join(ROOT, ".env.example");
  if (fs.existsSync(envPath)) {
    const envKeys = fs
      .readFileSync(envPath, "utf8")
      .split("\n")
      .filter((l) => l.trim() && !l.trim().startsWith("#"))
      .map((l) => l.split("=")[0]?.trim())
      .filter(Boolean);
    if (envKeys.length === 0) warnings += 1;
    else notes.push(`${envKeys.length} env key(s) in .env`);
  } else {
    warnings += 1;
    notes.push("No .env file (OK if using defaults)");
  }
  if (!fs.existsSync(examplePath)) {
    warnings += 1;
    notes.push("Missing .env.example template");
  }
  const gitEnv = spawnSync("git", ["ls-files", ".env"], { cwd: ROOT, encoding: "utf8" });
  if ((gitEnv.stdout || "").trim()) {
    errors += 1;
    notes.push("CRITICAL: .env is tracked by git — remove from repo");
  }
  return { errors, warnings, ok: errors === 0, notes };
}

function checkDependencies() {
  const notes = [];
  let errors = 0;
  let warnings = 0;

  if (!fs.existsSync(path.join(ROOT, "node_modules"))) {
    errors += 1;
    notes.push("node_modules missing — run npm install");
    return { errors, warnings, ok: false, notes };
  }

  const ls = spawnSync("npm", ["ls", "--depth=0", "--json"], {
    cwd: ROOT,
    encoding: "utf8",
    shell: true,
    maxBuffer: 10 * 1024 * 1024,
  });
  const lsData = parseJson(ls.stdout || ls.stderr || "");
  if (lsData?.problems?.length) {
    errors += lsData.problems.length;
    notes.push(`${lsData.problems.length} missing or invalid package(s)`);
  } else {
    notes.push("All declared dependencies installed");
  }

  const auditProd = spawnSync("npm", ["audit", "--omit=dev", "--json"], {
    cwd: ROOT,
    encoding: "utf8",
    shell: true,
    maxBuffer: 10 * 1024 * 1024,
  });
  const prodMeta = parseJson(auditProd.stdout || "")?.metadata?.vulnerabilities;
  if (prodMeta) {
    const prodHigh = (prodMeta.high || 0) + (prodMeta.critical || 0);
    const prodMod = prodMeta.moderate || 0;
    if (prodHigh > 0) {
      errors += prodHigh;
      notes.push(`${prodHigh} high/critical in production dependencies`);
    }
    if (prodMod > 0) {
      warnings += prodMod;
      notes.push(`${prodMod} moderate in production dependencies`);
    }
    if (!prodHigh && !prodMod) notes.push("Production dependencies: no vulnerabilities");
  }

  const auditDev = spawnSync("npm", ["audit", "--json"], {
    cwd: ROOT,
    encoding: "utf8",
    shell: true,
    maxBuffer: 10 * 1024 * 1024,
  });
  const devMeta = parseJson(auditDev.stdout || "")?.metadata?.vulnerabilities;
  if (devMeta) {
    const devHigh = (devMeta.high || 0) + (devMeta.critical || 0);
    const devMod = devMeta.moderate || 0;
    const devTotal = devHigh + devMod + (devMeta.low || 0);
    const prodTotal =
      (prodMeta?.high || 0) + (prodMeta?.critical || 0) + (prodMeta?.moderate || 0) + (prodMeta?.low || 0);
    const devOnly = Math.max(0, devTotal - prodTotal);
    if (devOnly > 0) {
      warnings += devOnly;
      notes.push(`${devOnly} dev-toolchain advisory (e.g. vitest UI — run npm audit fix)`);
    }
  }

  return { errors, warnings, ok: errors === 0, notes };
}

function checkBundleSize(buildOut) {
  const notes = [];
  let warnings = 0;
  const big = [...buildOut.matchAll(/dist\/assets\/(\S+)\s+(\d+(?:\.\d+)?)\s+kB/gi)]
    .map((m) => ({ file: m[1], kb: parseFloat(m[2]) }))
    .filter((x) => x.kb > 500);
  for (const b of big) {
    warnings += 1;
    notes.push(`Large chunk: ${b.file} (${b.kb} kB) — consider code-splitting`);
  }
  if (!big.length) notes.push("No chunks over 500 kB");
  return { warnings, notes };
}

console.log(paint(C.bold + C.cyan, "\n╔══════════════════════════════════════════════════════════╗"));
console.log(paint(C.bold + C.cyan, "║           COMMITTRACK — FULL PROJECT AUDIT               ║"));
console.log(paint(C.bold + C.cyan, "╚══════════════════════════════════════════════════════════╝"));
console.log(
  paint(
    C.dim,
    `Mode: ${STRICT ? "strict (code/CSS/env warnings fail; bundle size is advisory only)" : "default"} · ${new Date().toLocaleString()}\n`,
  ),
);

console.log(paint(C.bold, "Running checks…\n"));

// 1 — Environment
{
  const env = checkEnvHygiene();
  record("env", "Environment & secrets", env.errors, env.warnings, env.ok, env.notes);
}

// 2 — Dependencies
{
  process.stdout.write(`  ${paint(C.dim, "…")} Dependencies (install + npm audit)      `);
  const dep = checkDependencies();
  process.stdout.write(dep.ok && dep.warnings === 0 ? paint(C.green, "PASS\n") : dep.ok ? paint(C.yellow, "WARN\n") : paint(C.red, "FAIL\n"));
  record("deps", "Packages & vulnerabilities", dep.errors, dep.warnings, dep.ok, dep.notes, dep.errors > 0);
}

// 3 — CSS / styles (Safari prefixes, tokens)
{
  const r = runQuiet("CSS compatibility (styles)", "node", ["scripts/audit-styles.mjs", "--json"]);
  const data = parseJson(r.out) || { errors: 1, warnings: 0, errorItems: [] };
  const notes = [];
  if (data.errors) {
    notes.push(`${data.errors} CSS compatibility error(s)`);
    for (const e of (data.errorItems || []).slice(0, 3)) {
      notes.push(`${e.file}:${e.line} — ${e.message}`);
    }
  } else notes.push("Safari/WebKit prefixes & style rules OK");
  if (data.warnings) notes.push(`${data.warnings} CSS advisory warning(s)`);
  record("styles", "CSS & design tokens", data.errors, data.warnings, r.ok && data.errors === 0, notes);
}

// 4 — UI layout
{
  const r = runQuiet("UI layout (src/ui/ only)", "node", ["scripts/audit-ui.mjs", "--json"]);
  const data = parseJson(r.out) || { violations: 1, duplicateReexports: 0 };
  const errors = (data.violations || 0) + (data.duplicateReexports || 0);
  const notes = [];
  if (data.violations) notes.push(`${data.violations} UI rule violation(s)`);
  if (data.duplicateReexports) notes.push(`${data.duplicateReexports} duplicate re-export shim(s)`);
  if (!errors) notes.push("All visual UI under src/ui/");
  record("ui", "UI layout (JSX class rules)", errors, 0, r.ok && errors === 0, notes);
}

// 5 — Code (lint, knip, hygiene)
{
  const codeArgs = ["scripts/audit-code.mjs", "--json", "--quiet"];
  if (STRICT) codeArgs.push("--strict");
  const r = runQuiet("Code health (ESLint + Knip + imports)", "node", codeArgs);
  const data =
    parseJson(r.out) ||
    ({ errors: 1, warnings: 0, blocking: 1, eslint: { errors: 1 }, knip: {} });
  const depth = data.uiDepth || {};
  const notes = [
    `ESLint ${data.eslint?.errors ?? "?"} error(s), ${data.eslint?.warnings ?? "?"} warning(s)`,
    `Knip ${data.knip?.unusedFiles ?? 0} unused file(s), ${data.knip?.unusedExports ?? 0} unused export(s)`,
  ];
  if (depth.total > 0) {
    notes.push(
      `UI depth: ${depth.total} on-screen issue(s) (dead buttons/pages/tools) — npm run audit:ui-depth -- --list`,
    );
  } else {
    notes.push("UI depth: screens, nav, tools, barrel OK");
  }
  if (data.errors > 0) notes.push(`${data.errors} hygiene/import error(s)`);
  record(
    "code",
    "JavaScript (lint, dead code, types usage)",
    data.errors,
    data.warnings,
    r.ok && (data.blocking ?? data.errors) === 0,
    notes,
  );
}

// 6 — Unit tests
{
  const r = runQuiet("Unit tests (vitest)", "npm", ["test"]);
  const vt = parseVitestOutput(r.out);
  const errors = vt.failed || (r.ok ? 0 : 1);
  const warnings = r.ok && vt.passed === 0 ? 1 : 0;
  const notes = [];
  if (vt.passed > 0) {
    notes.push(
      vt.files != null
        ? `${vt.passed} test(s) passed · ${vt.files} file(s)`
        : `${vt.passed} test(s) passed`,
    );
  } else if (r.ok) {
    notes.push("Vitest passed but test count not parsed — check reporter output");
  } else {
    notes.push("Vitest run failed");
  }
  record("tests", "Unit tests", errors, warnings, r.ok && errors === 0 && warnings === 0, notes);
}

// 7 — TypeScript
{
  const r = runQuiet("TypeScript (tsc --noEmit)", "npx", ["tsc", "--noEmit", "-p", "tsconfig.json"]);
  const errMatch = r.out.match(/error TS\d+:/g);
  const tsErrors = errMatch ? errMatch.length : r.ok ? 0 : 1;
  const notes = tsErrors
    ? [`${tsErrors} type error(s) — run npm run typecheck`]
    : ["Types check passed (strict + checkJs on src/)"];
  record("types", "TypeScript safety", tsErrors, 0, r.ok && tsErrors === 0, notes);
}

// 8 — Production build
{
  const r = runQuiet("Production build (vite)", "npm", ["run", "build"]);
  const bundle = checkBundleSize(r.out);
  const errors = r.ok ? 0 : 1;
  record("build", "Production build & bundles", errors, bundle.warnings, r.ok, bundle.notes, false);
}

// ── Report ───────────────────────────────────────────────────────────────────
const totalErrors = sections.reduce((s, x) => s + x.errors, 0);
const totalWarnings = sections.reduce((s, x) => s + x.warnings, 0);
const blockingWarnings = sections
  .filter((x) => x.strictBlocks)
  .reduce((s, x) => s + x.warnings, 0);

const allOk =
  sections.every((x) => x.ok && x.errors === 0) &&
  (STRICT ? blockingWarnings === 0 : true);

console.log(paint(C.bold, "\n────────────────────────────────────────────────────────────"));
console.log(paint(C.bold, " AUDIT REPORT"));
console.log(paint(C.bold, "────────────────────────────────────────────────────────────\n"));

const col1 = 34;
for (const s of sections) {
  const status =
    s.errors > 0
      ? paint(C.red, "FAIL ")
      : s.warnings > 0
        ? paint(C.yellow, "WARN ")
        : paint(C.green, "PASS ");

  const errStr =
    s.errors === 0 ? paint(C.green, String(s.errors).padStart(3)) : paint(C.red, String(s.errors).padStart(3));
  const warnStr =
    s.warnings === 0
      ? paint(C.green, String(s.warnings).padStart(3))
      : paint(C.yellow, String(s.warnings).padStart(3));

  console.log(
    `${status} ${s.label.padEnd(col1)} ${paint(C.dim, "errors")} ${errStr}  ${paint(C.dim, "warnings")} ${warnStr}`,
  );
  for (const n of s.notes.slice(0, 3)) {
    console.log(paint(C.dim, `         ↳ ${n}`));
  }
}

console.log(paint(C.bold, "\n────────────────────────────────────────────────────────────"));
console.log(" TOTALS\n");

console.log(
  totalErrors === 0
    ? paint(C.green, `  ● Blocking errors:     ${totalErrors}`)
    : paint(C.red, `  ● Blocking errors:     ${totalErrors}`),
);
console.log(
  totalWarnings === 0
    ? paint(C.green, `  ● Advisories:          ${totalWarnings}`)
    : paint(C.yellow, `  ● Advisories:          ${totalWarnings}`),
);
if (STRICT) {
  console.log(
    blockingWarnings === 0
      ? paint(C.green, `  ● Strict-block warnings: ${blockingWarnings}`)
      : paint(C.red, `  ● Strict-block warnings: ${blockingWarnings}`),
  );
}
console.log(paint(C.dim, "  ● RED/FAIL = must fix · YELLOW/WARN = review · GREEN/PASS = clean"));
console.log(
  paint(C.dim, "  ● Checks: env, deps, CSS, UI layout, code+UI depth, tests, types, build"),
);

console.log();
if (allOk) {
  console.log(paint(C.bold + C.green, "  ✓ ALL CHECKS PASSED — project is clean.\n"));
  if (totalWarnings > 0) {
    console.log(paint(C.yellow, `  (${totalWarnings} advisory warning(s) — see WARN rows above)\n`));
  }
  process.exit(0);
}

console.log(paint(C.bold + C.red, "  ✗ AUDIT FAILED — fix blocking issues above.\n"));
process.exit(1);
