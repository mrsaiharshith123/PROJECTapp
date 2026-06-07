#!/usr/bin/env node
/**
 * User-facing copy tone audit — flags informal / casual language.
 *
 *   npm run audit:copy
 *   npm run audit:copy -- --list
 *   node scripts/audit-copy-tone.mjs --json --strict
 */
import { parseArgs } from "./lib/audit-core.mjs";
import { runCopyToneAudit } from "./lib/copy-tone-rules.mjs";

const { json, list, quiet, strict } = parseArgs();

const report = runCopyToneAudit();
const blocking = report.errors + (strict ? report.warnings : 0);

if (json) {
  console.log(
    JSON.stringify({
      errors: report.errors,
      warnings: report.warnings,
      blocking,
      errorItems: report.errorItems,
      warningItems: report.warningItems,
    }),
  );
  process.exit(blocking > 0 ? 1 : 0);
}

if (!quiet) {
  console.log("Copy tone audit (formal user-facing language)\n");
  console.log(`Rules checked: informal greetings, contractions, what-if, casual CTAs, idioms\n`);
}

if (list || (!quiet && report.hits.length > 0)) {
  for (const h of report.hits) {
    const tag = h.severity === "warning" ? "WARN" : "FAIL";
    console.log(`  [${tag}] ${h.file}:${h.line} (${h.rule})`);
    console.log(`         ${h.message}`);
    console.log(`         ${h.excerpt}\n`);
  }
}

if (!quiet) {
  console.log("────────────────────────────────────────");
  console.log(
    `Summary: ${report.errors} error(s), ${report.warnings} warning(s)` +
      (strict ? " (strict: warnings fail too)" : ""),
  );
  if (report.errors === 0 && report.warnings === 0) {
    console.log("User-facing copy tone OK — no informal patterns detected.");
  } else {
    console.log("Fix lines above or add // copy-tone:ignore on that line with justification.");
  }
}

process.exit(blocking > 0 ? 1 : 0);
