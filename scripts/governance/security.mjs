/**
 * Security audit — static heuristics for common vulnerabilities.
 * Role: Security Engineer
 */
import fs from "fs";
import path from "path";
import { ROOT, SRC, rel, walk } from "../lib/audit-core.mjs";

const SENSITIVE_LOCALSTORAGE_KEYS = ["pan", "bank", "account", "aadhaar", "password", "secret", "token", "key"];
const DANGEROUS_PATTERNS = [
  { re: /dangerouslySetInnerHTML/, kind: "xss-risk", sev: "error", msg: "dangerouslySetInnerHTML — XSS risk. Sanitise with DOMPurify if truly needed." },
  { re: /\beval\s*\(/, kind: "eval", sev: "error", msg: "eval() — arbitrary code execution risk." },
  { re: /new Function\s*\(/, kind: "new-function", sev: "error", msg: "new Function() — arbitrary code execution risk." },
  { re: /innerHTML\s*=/, kind: "innerhtml", sev: "error", msg: "innerHTML assignment — XSS risk. Use textContent or React." },
];
const HARDCODED_SECRET_RE = /(?:api[_-]?key|apikey|secret|token|password|bearer)\s*[:=]\s*["'][A-Za-z0-9+/=_-]{20,}["']/i;
const SUPABASE_IN_UI_RE = /from\s+["']@supabase\/supabase-js["']/;
const ALLOWED_SUPABASE = ["context/AuthContext", "services/", "supabase/", "scripts/"];

export function runSecurityAudit() {
  const errors = [], warnings = [], advisories = [];

  for (const file of walk(SRC, [], /\.(jsx|js)$/)) {
    const r = rel(file);
    if (r.includes("__tests__") || r.includes("governance")) continue;
    const code = fs.readFileSync(file, "utf8");
    const lines = code.split("\n");

    // XSS / code injection patterns
    for (const { re, kind, sev, msg } of DANGEROUS_PATTERNS) {
      if (re.test(code)) {
        (sev === "error" ? errors : warnings).push({ kind, file: r, message: msg });
      }
    }

    // Hardcoded secrets
    if (HARDCODED_SECRET_RE.test(code)) {
      errors.push({ kind: "hardcoded-secret", file: r,
        message: "Possible hardcoded secret/token — move to env var" });
    }

    // Supabase direct in UI layer
    if (SUPABASE_IN_UI_RE.test(code) && !ALLOWED_SUPABASE.some(p => r.includes(p))) {
      warnings.push({ kind: "supabase-direct-ui", file: r,
        message: "Supabase imported directly in UI — route through services/ or context/" });
    }

    // localStorage storing sensitive data
    lines.forEach((line, i) => {
      if (/localStorage\.setItem\s*\(/.test(line)) {
        const key = (line.match(/setItem\s*\(\s*["']([^"']+)["']/) || [])[1] || "";
        if (SENSITIVE_LOCALSTORAGE_KEYS.some(k => key.toLowerCase().includes(k))) {
          warnings.push({ kind: "sensitive-localstorage", file: r, line: i + 1,
            message: `localStorage key "${key}" may store sensitive data — consider encryption or server-only storage` });
        }
      }
    });

    // Financial inputs without validation
    if (r.includes("engines/") && /\/ income\b|\/ monthlyIncome\b/.test(code) &&
        !/income\s*>\s*0|income\s*&&|Math\.max/.test(code)) {
      warnings.push({ kind: "division-no-guard", file: r,
        message: "Division by income without zero-guard — will produce Infinity if income=0" });
    }

    // Missing auth guard on route rendering
    if (r.includes("pages/") && r.endsWith("Page.jsx") &&
        !r.includes("Auth") && !r.includes("Onboarding") && !r.includes("Privacy") &&
        /usePerovo|useNetWorth/.test(code) &&
        !/RequireAuth|isLoggedIn|isReady/.test(code)) {
      advisories.push({ kind: "missing-auth-check", file: r,
        message: "Page uses app context but no auth guard visible — verify RequireAuth wraps this route in App.jsx" });
    }
  }

  // Check .env.example doesn't contain real values
  const envExample = path.join(ROOT, ".env.example");
  if (fs.existsSync(envExample)) {
    const envContent = fs.readFileSync(envExample, "utf8");
    if (/=\s*[A-Za-z0-9+/=_-]{32,}/.test(envContent)) {
      warnings.push({ kind: "env-example-real-value", file: ".env.example",
        message: ".env.example may contain a real secret value (long string after =)" });
    }
  }

  return { id: "security", title: "Security (XSS, secrets, auth, storage)", errors, warnings, advisories };
}
