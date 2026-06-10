#!/usr/bin/env node
/**
 * Combined i18n UI quality: hardcoded JSX + English fallback in locales.
 *   npm run audit:i18n:ui
 */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const JSON_OUT = process.argv.includes("--json");
const STRICT = process.argv.includes("--strict");

function run(script, extra = []) {
  const r = spawnSync("node", [path.join("scripts", script), "--json", ...extra], {
    cwd: ROOT,
    encoding: "utf8",
    shell: true,
  });
  try {
    return JSON.parse((r.stdout || "").trim() || "{}");
  } catch {
    return { errors: 1, total: 1 };
  }
}

function main() {
  const hardcoded = run("audit-i18n-hardcoded.mjs", STRICT ? ["--strict"] : []);
  const fallback = run("audit-i18n-fallback.mjs");

  const hardErrors = hardcoded.errors ?? hardcoded.total ?? 0;
  const fallCount = fallback.total ?? fallback.errors ?? (fallback.items?.length || 0);

  const payload = {
    hardcoded: hardErrors,
    fallback: fallCount,
    total: hardErrors + (STRICT ? fallCount : 0),
  };

  if (JSON_OUT) {
    console.log(JSON.stringify(payload));
    process.exit(payload.total > 0 && STRICT ? 1 : 0);
  }

  console.log(`i18n UI: ${hardErrors} hardcoded JSX issue(s), ${fallCount} English fallback value(s) in non-en locales`);
  if (!STRICT && fallCount > 0) {
    console.log("  (fallback count is advisory unless --strict)");
  }
  process.exit(STRICT && payload.total > 0 ? 1 : 0);
}

main();
