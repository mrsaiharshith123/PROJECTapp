/**
 * DevOps, build process & CI/CD audit.
 * Role: DevOps Engineer
 */
import fs from "fs";
import path from "path";
import { ROOT, SRC, rel, walk } from "../lib/audit-core.mjs";

export function runDevopsAudit() {
  const errors = [], warnings = [], advisories = [];

  // CI/CD pipeline
  const workflowDir = path.join(ROOT, ".github/workflows");
  if (!fs.existsSync(workflowDir)) {
    errors.push({ kind: "no-ci", message: "No .github/workflows/ — no CI/CD pipeline. Add lint + test + build jobs." });
  } else {
    const workflows = fs.readdirSync(workflowDir).filter(f => f.endsWith(".yml") || f.endsWith(".yaml"));
    if (workflows.length === 0) {
      errors.push({ kind: "empty-ci", message: ".github/workflows/ exists but has no workflow files" });
    }
    const ciContent = workflows.map(f => fs.readFileSync(path.join(workflowDir, f), "utf8")).join("\n");
    if (!/npm\s+test|vitest|jest/.test(ciContent)) {
      warnings.push({ kind: "ci-no-tests", message: "CI pipeline does not run tests — add: npm test" });
    }
    if (!/npm\s+run\s+lint|eslint/.test(ciContent)) {
      warnings.push({ kind: "ci-no-lint", message: "CI pipeline does not run lint — add: npm run lint" });
    }
  }

  // npm script sprawl
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const scriptCount = Object.keys(pkg.scripts || {}).length;
  if (scriptCount > 80) {
    warnings.push({ kind: "script-sprawl",
      message: `${scriptCount} npm scripts — overwhelming for new engineers. Consider a scripts/README.md grouping them by purpose.` });
  }

  // console.log in production source (not scripts, not tests)
  let consoleCount = 0;
  const CONSOLE_SKIP = /scripts\/|__tests__|governance\/|\.test\.|landing\//;
  for (const file of walk(SRC, [], /\.(jsx|js)$/)) {
    const r = rel(file);
    if (CONSOLE_SKIP.test(r)) continue;
    const code = fs.readFileSync(file, "utf8");
    const matches = code.match(/console\.(log|warn|error|debug|info)\s*\(/g) || [];
    if (matches.length > 0) {
      consoleCount += matches.length;
    }
  }
  if (consoleCount > 20) {
    warnings.push({ kind: "console-in-prod",
      message: `${consoleCount} console.* calls in production source — replace with structured logger or remove` });
  }

  // .env.example completeness
  const envExample = path.join(ROOT, ".env.example");
  if (!fs.existsSync(envExample)) {
    errors.push({ kind: "no-env-example", message: "Missing .env.example — new developers cannot set up the project" });
  }

  // package-lock.json (reproducible installs)
  if (!fs.existsSync(path.join(ROOT, "package-lock.json"))) {
    warnings.push({ kind: "no-lockfile", message: "No package-lock.json — installs are not reproducible across machines" });
  }

  // Build script steps
  const buildScript = pkg.scripts?.build || "";
  const requiredBuildSteps = ["generate-pwa-icons", "generate-app-version", "build-ota-bundle"];
  for (const step of requiredBuildSteps) {
    if (!buildScript.includes(step)) {
      advisories.push({ kind: "build-step-missing",
        message: `Build script missing step: ${step}` });
    }
  }

  // TypeScript config
  if (!fs.existsSync(path.join(ROOT, "tsconfig.json"))) {
    warnings.push({ kind: "no-tsconfig", message: "No tsconfig.json — TypeScript checking disabled" });
  } else {
    try {
      const raw = fs.readFileSync(path.join(ROOT, "tsconfig.json"), "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
      const ts = JSON.parse(raw);
      if (!ts.compilerOptions?.strict) {
        advisories.push({ kind: "ts-no-strict", message: "TypeScript strict mode not enabled — enable for best type safety" });
      }
    } catch {
      warnings.push({ kind: "tsconfig-parse", message: "tsconfig.json could not be parsed for strict-mode check" });
    }
  }

  return { id: "devops", title: "DevOps, build & CI/CD health", errors, warnings, advisories };
}
