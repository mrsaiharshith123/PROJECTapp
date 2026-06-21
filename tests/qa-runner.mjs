#!/usr/bin/env node
/**
 * Perovo QA Runner — Chaos & Security Terminal Reporter
 * Usage:
 *   npm run qa              → full run, all suites
 *   npm run qa -- --fast    → skip slow tests
 *   npm run qa -- --p0      → only critical failures
 */
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  bright_red: "\x1b[91m",
  yellow: "\x1b[33m",
  bright_yellow: "\x1b[93m",
  green: "\x1b[32m",
  bright_green: "\x1b[92m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  white: "\x1b[97m",
  bg_red: "\x1b[41m",
  bg_green: "\x1b[42m",
  bg_yellow: "\x1b[43m",
};

const args = process.argv.slice(2);
const FAST = args.includes("--fast");
const ONLY_P0 = args.includes("--p0") || args.includes("--severity=P0");

console.log("");
console.log(`${C.bold}${C.cyan}╔══════════════════════════════════════════════════════════╗${C.reset}`);
console.log(`${C.bold}${C.cyan}║   PEROVO — AI QUALITY ENGINEERING SUITE                  ║${C.reset}`);
console.log(`${C.bold}${C.cyan}║   Chaos · Security · Fintech · Edge Cases · Architecture ║${C.reset}`);
console.log(`${C.bold}${C.cyan}╚══════════════════════════════════════════════════════════╝${C.reset}`);
console.log(`${C.dim}  Mode: ${FAST ? "FAST (skipping slow tests)" : "FULL"} · Only P0: ${ONLY_P0}${C.reset}`);
console.log("");

const startTime = Date.now();
let vitestJson = null;

const vitestCmd = FAST
  ? "npx vitest run --reporter=json --exclude=**/*1000*"
  : "npx vitest run --reporter=json";

try {
  const output = execSync(vitestCmd, {
    cwd: process.cwd(),
    encoding: "utf-8",
    timeout: 120000,
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });
  try {
    vitestJson = JSON.parse(output);
  } catch {
    const jsonStart = output.indexOf("{");
    if (jsonStart >= 0) vitestJson = JSON.parse(output.slice(jsonStart));
  }
} catch (err) {
  const stdout = err.stdout?.toString?.() || err.stdout || "";
  try {
    const jsonStart = stdout.indexOf("{");
    if (jsonStart >= 0) vitestJson = JSON.parse(stdout.slice(jsonStart));
  } catch {
    console.error(`${C.bright_red}Failed to parse vitest JSON output${C.reset}`);
    if (stdout) console.error(stdout.slice(0, 500));
    process.exit(3);
  }
}

const findings = { P0: [], P1: [], P2: [], P3: [], passed: [] };
let totalTests = 0;

if (vitestJson?.testResults) {
  for (const file of vitestJson.testResults) {
    const suiteName = file.displayName || file.name || "";
    for (const suite of file.assertionResults || []) {
      totalTests++;
      const title = suite.title || "";
      const fullTitle = suite.fullName || `${suiteName} > ${title}`;
      const sevMatch = title.match(/\[(P[0-3])\]/);
      const severity = sevMatch ? sevMatch[1] : null;

      if (suite.status === "failed") {
        const finding = {
          title: fullTitle,
          severity: severity || "P2",
          error: (suite.failureMessages || []).join("\n").slice(0, 200),
          file: file.displayName || file.name,
        };
        if (severity === "P0") findings.P0.push(finding);
        else if (severity === "P1") findings.P1.push(finding);
        else if (severity === "P3") findings.P3.push(finding);
        else findings.P2.push(finding);
      } else {
        findings.passed.push({ title: fullTitle, severity });
      }
    }
  }
}

const printFinding = (f, icon, color) => {
  const sev = f.severity ? `[${f.severity}]` : "";
  console.log(`  ${color}${icon} ${C.bold}${sev}${C.reset}${color} ${f.title}${C.reset}`);
  if (f.error) {
    const errLine = f.error.split("\n")[0].trim().slice(0, 100);
    console.log(`        ${C.dim}↳ ${errLine}${C.reset}`);
  }
};

if (findings.P0.length > 0) {
  console.log(`\n${C.bold}${C.bg_red}${C.white}  🚨 CRITICAL — FIX BEFORE ANY RELEASE (P0: ${findings.P0.length})  ${C.reset}`);
  findings.P0.forEach((f) => printFinding(f, "●", C.bright_red));
}

if (findings.P1.length > 0 && !ONLY_P0) {
  console.log(`\n${C.bold}${C.red}  ⚠  HIGH — Fix before public launch (P1: ${findings.P1.length})${C.reset}`);
  findings.P1.forEach((f) => printFinding(f, "▸", C.red));
}

if (findings.P2.length > 0 && !ONLY_P0) {
  console.log(`\n${C.yellow}  ●  MEDIUM — Fix soon (P2: ${findings.P2.length})${C.reset}`);
  findings.P2.forEach((f) => printFinding(f, "·", C.yellow));
}

if (findings.P3.length > 0 && !ONLY_P0) {
  console.log(`\n${C.dim}  ○  LOW — Nice to fix (P3: ${findings.P3.length})${C.reset}`);
  findings.P3.forEach((f) => printFinding(f, "·", C.dim));
}

console.log(`\n${C.cyan}  ℹ  ARCHITECTURE NOTICES:${C.reset}`);
const ARCH_CHECKS = [
  {
    check: () =>
      !existsSync(resolve(process.cwd(), "src/ui/styles/tokens.css")) ||
      !readFileSync(resolve(process.cwd(), "src/ui/styles/tokens.css"), "utf-8").includes("ct-grad-pressure"),
    msg: "Modern design tokens not applied — run Prompt S1",
    sev: "P2",
  },
  {
    check: () => !readFileSync(resolve(process.cwd(), "src/App.jsx"), "utf-8").includes('path="/plan"'),
    msg: "/plan route missing — Plan tab not accessible from nav",
    sev: "P2",
  },
  {
    check: () => !readFileSync(resolve(process.cwd(), "src/App.jsx"), "utf-8").includes('path="/money"'),
    msg: "/money route missing — Money tab not accessible from nav",
    sev: "P2",
  },
  {
    check: () => !readFileSync(resolve(process.cwd(), "src/constants/userModes.js"), "utf-8").includes('"wallet"'),
    msg: "Nav still uses old tabs (Bills/Lending) not Money/Plan",
    sev: "P2",
  },
  {
    check: () => {
      const app = readFileSync(resolve(process.cwd(), "src/App.jsx"), "utf-8");
      return !app.includes('path="/analytics"') && !app.includes('path="/money"');
    },
    msg: "Analytics unreachable from nav bar",
    sev: "P2",
  },
];

let archWarnings = 0;
for (const item of ARCH_CHECKS) {
  try {
    if (item.check()) {
      console.log(`  ${C.yellow}[${item.sev}]${C.reset} ${C.dim}${item.msg}${C.reset}`);
      archWarnings++;
    }
  } catch {
    /* skip unreadable files */
  }
}
if (archWarnings === 0) {
  console.log(`  ${C.green}✓ All architecture checks passed${C.reset}`);
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
const passRate = totalTests > 0 ? ((findings.passed.length / totalTests) * 100).toFixed(0) : 0;
const healthScore = Math.max(
  0,
  10 - findings.P0.length * 3 - findings.P1.length * 1.5 - findings.P2.length * 0.5 - archWarnings * 0.3,
).toFixed(1);
const healthColor = healthScore >= 8 ? C.bright_green : healthScore >= 5 ? C.yellow : C.bright_red;
const launchReady = findings.P0.length === 0 && findings.P1.length < 3;

console.log("");
console.log(`${C.bold}${C.cyan}╔══════════════════════════════════════════════════════════╗${C.reset}`);
console.log(`${C.bold}${C.cyan}║  FINAL QA REPORT                                         ║${C.reset}`);
console.log(`${C.bold}${C.cyan}╠══════════════════════════════════════════════════════════╣${C.reset}`);
console.log(`${C.bold}${C.cyan}║${C.reset}  ${C.bright_red}🔴 CRITICAL (P0): ${String(findings.P0.length).padEnd(4)}${C.reset}  Must fix before any release    ${C.bold}${C.cyan}║${C.reset}`);
console.log(`${C.bold}${C.cyan}║${C.reset}  ${C.red}🟠 HIGH (P1):     ${String(findings.P1.length).padEnd(4)}${C.reset}  Fix before public launch        ${C.bold}${C.cyan}║${C.reset}`);
console.log(`${C.bold}${C.cyan}║${C.reset}  ${C.yellow}🟡 MEDIUM (P2):   ${String(findings.P2.length).padEnd(4)}${C.reset}  Fix soon                        ${C.bold}${C.cyan}║${C.reset}`);
console.log(`${C.bold}${C.cyan}║${C.reset}  ${C.dim}⚪ LOW (P3):      ${String(findings.P3.length).padEnd(4)}${C.reset}  Nice to fix                     ${C.bold}${C.cyan}║${C.reset}`);
console.log(`${C.bold}${C.cyan}║${C.reset}  ${C.bright_green}✅ PASSED:        ${String(findings.passed.length).padEnd(4)}${C.reset}  Looking good                   ${C.bold}${C.cyan}║${C.reset}`);
console.log(`${C.bold}${C.cyan}╠══════════════════════════════════════════════════════════╣${C.reset}`);
console.log(`${C.bold}${C.cyan}║${C.reset}  Pass rate: ${passRate}%    Health: ${healthColor}${healthScore}/10${C.reset}    Time: ${elapsed}s          ${C.bold}${C.cyan}║${C.reset}`);
console.log(`${C.bold}${C.cyan}║${C.reset}  Launch ready: ${launchReady ? `${C.bright_green}✅ YES${C.reset}` : `${C.bright_red}❌ NO (fix P0 + P1 first)${C.reset}`}                    ${C.bold}${C.cyan}║${C.reset}`);
console.log(`${C.bold}${C.cyan}╚══════════════════════════════════════════════════════════╝${C.reset}`);

if (findings.P0.length > 0 || findings.P1.length > 0) {
  console.log(`\n${C.bold}  ⚡ MOST VULNERABLE AREAS:${C.reset}`);
  [...findings.P0, ...findings.P1].slice(0, 5).forEach((f, i) => {
    console.log(`  ${i + 1}. ${C.red}[${f.severity}]${C.reset} ${f.title.split(">").pop().trim()}`);
  });
}

console.log(`\n${C.dim}  Run 'npm run qa -- --p0' to see only critical issues${C.reset}`);
console.log(`${C.dim}  Run 'npm test' to re-run tests without the full report${C.reset}`);
console.log("");

if (findings.P0.length > 0) process.exit(2);
if (findings.P1.length > 0) process.exit(1);
process.exit(0);
