/**
 * Accessibility audit (static heuristics for src/ui/).
 */
import fs from "fs";
import { rel, walk, UI } from "../lib/audit-core.mjs";

const ICON_ONLY_BTN =
  /<button[^>]*>[\s\n]*(?:<CtIcon|<svg|{[^}]*CtIcon)[^<]*<\/button>/gi;
const BTN_ARIA = /aria-label\s*=|aria-labelledby\s*=|<button[^>]*>[^<\s{][^<]{0,80}<\/button>/;

export function runA11yAudit() {
  const errors = [];
  const warnings = [];
  const advisories = [];

  for (const file of walk(UI, [], /\.jsx$/)) {
    const r = rel(file);
    const code = fs.readFileSync(file, "utf8");
    const lines = code.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const ln = i + 1;

      if (/<img\b/.test(line) && !/\balt\s*=/.test(line) && !/role\s*=\s*["']presentation["']/.test(line)) {
        warnings.push({
          kind: "img-alt",
          file: r,
          line: ln,
          message: "<img> without alt — add alt text or role=\"presentation\"",
        });
      }

      if (/<div[^>]+onClick\s*=/.test(line) && !/role\s*=/.test(line) && !/tabIndex/.test(line)) {
        advisories.push({
          kind: "clickable-div",
          file: r,
          line: ln,
          message: "Clickable <div> without role/tabIndex — prefer <button>",
        });
      }

      if (
        /<input\b/.test(line) &&
        !/\btype\s*=\s*["'](?:hidden|submit|button|checkbox|radio)["']/.test(line) &&
        !/\bid\s*=/.test(line) &&
        !/\baria-label\s*=/.test(line)
      ) {
        const prev = lines.slice(Math.max(0, i - 3), i).join("\n");
        if (!/<label[^>]*htmlFor/.test(prev) && !/<Field\b/.test(prev)) {
          advisories.push({
            kind: "input-label",
            file: r,
            line: ln,
            message: "Input may lack associated label — use Field or aria-label",
          });
        }
      }
    }

    if (/<Fab\b/.test(code)) {
      const fabBlocks = code.match(/<Fab[^>]*>[\s\S]*?<\/Fab>/g) || [];
      for (const block of fabBlocks) {
        if (!/aria-label\s*=/.test(block)) {
          warnings.push({
            kind: "fab-label",
            file: r,
            message: "<Fab> without aria-label",
          });
        }
      }
    }

    if (code.includes("role=\"dialog\"") || code.includes('role="dialog"')) {
      if (!/aria-modal\s*=/.test(code)) {
        warnings.push({
          kind: "dialog-modal",
          file: r,
          message: "Dialog role without aria-modal=\"true\"",
        });
      }
    }

    const iconOnlyMatches = code.match(ICON_ONLY_BTN) || [];
    for (const m of iconOnlyMatches) {
      if (!BTN_ARIA.test(m)) {
        warnings.push({
          kind: "icon-button",
          file: r,
          message: "Icon-only button may lack accessible name (aria-label)",
        });
        break;
      }
    }
  }

  return {
    id: "a11y",
    title: "Accessibility (ARIA, labels, semantics)",
    errors,
    warnings,
    advisories,
  };
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  const { printReport, exitCode, parseArgs } = await import("../lib/audit-core.mjs");
  const opts = parseArgs();
  const report = runA11yAudit();
  const s = printReport(report, opts);
  process.exit(exitCode(s, opts.strict));
}
