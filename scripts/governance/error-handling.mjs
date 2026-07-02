/**
 * Error handling & reliability audit.
 * Role: Reliability Engineer
 */
import fs from "fs";
import path from "path";
import { SRC, rel, walk } from "../lib/audit-core.mjs";

export function runErrorHandlingAudit() {
  const errors = [], warnings = [], advisories = [];

  for (const file of walk(SRC, [], /\.(jsx|js)$/)) {
    const r = rel(file);
    if (r.includes("__tests__") || r.includes("governance")) continue;
    const code = fs.readFileSync(file, "utf8");

    // Async function or arrow function without try/catch that calls fetch/supabase
    const hasFetch    = /\bfetch\s*\(|\bsupabase\.|\binvoke\s*\(/.test(code);
    const hasTryCatch = /try\s*\{/.test(code);
    const hasAsync    = /async\s+function|async\s+\(|async\s+\w+\s*=>/.test(code);
    if (hasAsync && hasFetch && !hasTryCatch) {
      warnings.push({ kind: "async-no-try-catch", file: r,
        message: "Async function with network calls but no try/catch — unhandled rejection will crash the component" });
    }

    // .map() on value that could be undefined (no optional chaining or default)
    const unsafeMap = [...code.matchAll(/\b(?:commitments|lendings|goals|entries|items|list)\b\.map\s*\(/g)];
    const hasMapGuard = /(?:commitments|lendings|goals|entries|items|list)\s*\?\s*\.\s*map|\|\|\s*\[\]/.test(code);
    if (unsafeMap.length > 2 && !hasMapGuard && r.includes("ui/")) {
      advisories.push({ kind: "unsafe-map", file: r,
        message: ".map() on data arrays without null guard — crashes if API returns null. Use (arr ?? []).map()" });
    }

    // Lazy route without ErrorBoundary check (in App.jsx only)
    if (r.includes("App.jsx")) {
      const lazyComponents = [...code.matchAll(/const (\w+) = lazy\(/g)].map(m => m[1]);
      for (const comp of lazyComponents) {
        if (!new RegExp(`RouteErrorBoundary[\\s\\S]{0,300}${comp}`).test(code)) {
          advisories.push({ kind: "lazy-no-boundary", file: r,
            message: `Lazy component "${comp}" has no RouteErrorBoundary — one crash unmounts the entire app` });
        }
      }
    }
  }

  // Check for missing loading states in data-heavy features
  const criticalPages = ["LedgerPage", "HomePage", "InsightsBreakdown", "AgreementsPage"];
  for (const page of criticalPages) {
    const pageFile = walk(SRC, [], /\.jsx$/).find(f => f.includes(page));
    if (!pageFile) continue;
    const code = fs.readFileSync(pageFile, "utf8");
    if (!/loading|isLoading|isFetching|skeleton|Skeleton|RouteFallback/.test(code)) {
      advisories.push({ kind: "missing-loading-state", file: rel(pageFile),
        message: `${page}: no visible loading state — users see empty or broken UI during data fetch` });
    }
  }

  return { id: "error-handling", title: "Error handling & reliability", errors, warnings, advisories };
}
