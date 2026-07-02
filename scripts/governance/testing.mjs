/**
 * Test coverage & QA discipline audit.
 * Role: QA Lead + Test Engineer
 */
import fs from "fs";
import path from "path";
import { SRC, rel, walk } from "../lib/audit-core.mjs";

const CRITICAL_ENGINES = [
  "perovoScore.js", "pressureScore.js", "survival.js", "incomeTaxEstimate.js",
  "safeToSpend.js", "affordability.js", "burden.js", "forecast.js",
  "lendingTrust.js", "emergencyFund.js", "financialHealth.js", "netWorthBenchmark.js",
];

export function runTestingAudit() {
  const errors = [], warnings = [], advisories = [];
  const enginesDir = path.join(SRC, "engines");
  const testsDir   = path.join(enginesDir, "__tests__");

  // Engine test coverage
  const allEngines = fs.existsSync(enginesDir)
    ? fs.readdirSync(enginesDir).filter(f => f.endsWith(".js") && !f.startsWith("_"))
    : [];
  const testFiles = fs.existsSync(testsDir)
    ? new Set(fs.readdirSync(testsDir).map(f => f.replace(/\.test\.js$/, ".js")))
    : new Set();

  const untestedCritical = CRITICAL_ENGINES.filter(e => !testFiles.has(e));
  const untestedTotal    = allEngines.filter(e => !testFiles.has(e));

  if (untestedCritical.length > 0) {
    errors.push({
      kind: "critical-engines-untested",
      message: `${untestedCritical.length} CRITICAL engines have no unit tests: ${untestedCritical.join(", ")}`,
      detail: "Users make financial decisions from these outputs. Wrong numbers = wrong decisions.",
    });
  }

  if (untestedTotal.length > 10) {
    warnings.push({
      kind: "engine-test-coverage",
      message: `${untestedTotal.length}/${allEngines.length} engines lack unit tests (${Math.round((allEngines.length - untestedTotal.length) / allEngines.length * 100)}% coverage)`,
    });
  }

  // TODO/FIXME/HACK in engine files
  let todoCount = 0;
  for (const file of walk(enginesDir, [], /\.js$/)) {
    const code = fs.readFileSync(file, "utf8");
    const todos = (code.match(/\b(TODO|FIXME|HACK|XXX|BUG)\b/g) || []).length;
    if (todos > 0) {
      todoCount += todos;
      advisories.push({ kind: "todo-in-engine", file: rel(file),
        message: `${todos} TODO/FIXME marker(s) in financial engine — resolve before launch` });
    }
  }

  // Commented-out code in engines (heuristic: lines starting with //)
  for (const file of walk(enginesDir, [], /\.js$/)) {
    const lines = fs.readFileSync(file, "utf8").split("\n");
    const commented = lines.filter(l => /^\s*\/\/\s*[a-zA-Z]/.test(l) && l.length > 40).length;
    if (commented > 8) {
      advisories.push({ kind: "commented-code", file: rel(file),
        message: `${commented} commented lines — remove dead code or convert to documentation` });
    }
  }

  // Suite files check
  const suitesDir = path.join(SRC, "..", "tests", "suites");
  const suiteCount = fs.existsSync(suitesDir) ? fs.readdirSync(suitesDir).length : 0;
  if (suiteCount < 5) {
    warnings.push({ kind: "low-suite-count",
      message: `Only ${suiteCount} test suites — add suites for: auth flows, payment, sync, edge cases` });
  }

  // Missing test for any payment/subscription critical path
  const hasPaymentTest = fs.existsSync(suitesDir) &&
    fs.readdirSync(suitesDir).some(f => /payment|subscription|razorpay/i.test(f));
  if (!hasPaymentTest) {
    errors.push({ kind: "no-payment-test",
      message: "No test suite covers the Razorpay payment/subscription flow — revenue path is untested" });
  }

  return { id: "testing", title: "Test coverage & QA discipline", errors, warnings, advisories };
}
