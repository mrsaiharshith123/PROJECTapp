/**
 * Light/dark theme token parity audit.
 */
import fs from "fs";
import path from "path";
import { ROOT, rel } from "../lib/audit-core.mjs";

const CRITICAL_TOKENS = [
  "--ct-accent",
  "--ct-surface",
  "--ct-surface-inset",
  "--ct-text",
  "--ct-text-muted",
  "--ct-border",
  "--ct-border-strong",
  "--ct-bg",
  "--ct-life-violet",
  "--ct-life-emerald",
  "--ct-shadow-card",
];

function extractTokens(css, scopeRe) {
  const block = scopeRe ? css.match(scopeRe)?.[0] || "" : css;
  const tokens = new Set();
  for (const m of block.matchAll(/(--ct-[\w-]+)\s*:/g)) tokens.add(m[1]);
  return tokens;
}

export function runThemeAudit() {
  const errors = [];
  const warnings = [];
  const advisories = [];

  const tokensPath = path.join(ROOT, "src/ui/styles/tokens.css");
  const themeLightPath = path.join(ROOT, "src/ui/styles/theme-light.css");
  const componentsPath = path.join(ROOT, "src/ui/styles/components.css");

  if (!fs.existsSync(tokensPath)) {
    errors.push({ kind: "tokens", message: "Missing src/ui/styles/tokens.css" });
    return { id: "theme", title: "Theme token parity", errors, warnings, advisories };
  }

  const tokensCss = fs.readFileSync(tokensPath, "utf8");
  const darkTokens = extractTokens(tokensCss, /html\[data-ui="ct"\]\s*\{[\s\S]*?(?=html\[data-ui="ct"\]\[data-theme)/);
  const lightBlock = tokensCss.match(/html\[data-ui="ct"\]\[data-theme="light"\]\s*\{[\s\S]*?\n\}/);
  const lightTokens = lightBlock ? extractTokens(lightBlock[0]) : new Set();

  if (!lightBlock) {
    errors.push({
      kind: "light-block",
      message: "tokens.css missing html[data-ui=\"ct\"][data-theme=\"light\"] block",
    });
  }

  for (const token of CRITICAL_TOKENS) {
    if (!darkTokens.has(token) && !tokensCss.includes(`${token}:`)) {
      warnings.push({ kind: "dark-token", message: `Dark theme missing critical token ${token}` });
    }
    if (lightBlock && !lightTokens.has(token)) {
      warnings.push({ kind: "light-token", message: `Light theme block missing ${token}` });
    }
  }

  if (!fs.existsSync(themeLightPath)) {
    warnings.push({ kind: "theme-light", message: "Missing theme-light.css polish overrides" });
  } else {
    const polish = fs.readFileSync(themeLightPath, "utf8");
    if (!polish.includes('[data-theme="light"]')) {
      warnings.push({ kind: "theme-light", message: "theme-light.css has no light selectors" });
    }
  }

  const mainCss = path.join(ROOT, "src/main.jsx");
  if (fs.existsSync(mainCss)) {
    const main = fs.readFileSync(mainCss, "utf8");
    if (!main.includes("theme-light.css") && !main.includes("tokens.css")) {
      advisories.push({
        kind: "import",
        file: rel(mainCss),
        message: "Ensure tokens.css and theme-light.css are imported in main entry",
      });
    }
  }

  if (fs.existsSync(componentsPath)) {
    const comp = fs.readFileSync(componentsPath, "utf8");
    if (!comp.includes('[data-theme="light"]') && !comp.includes("data-theme=\"light\"")) {
      advisories.push({
        kind: "light-components",
        file: rel(componentsPath),
        message: "components.css has no light-theme overrides — verify contrast on light mode",
      });
    }
  }

  return {
    id: "theme",
    title: "Light/dark theme token parity",
    errors,
    warnings,
    advisories,
  };
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  const { printReport, exitCode, parseArgs } = await import("../lib/audit-core.mjs");
  const opts = parseArgs();
  const report = runThemeAudit();
  const s = printReport(report, opts);
  process.exit(exitCode(s, opts.strict));
}
