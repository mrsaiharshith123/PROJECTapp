/**
 * Mobile / responsive risk audit (static).
 * Covers viewport overflow, fixed widths, safe resize for PWA/TWA/Capacitor.
 */
import fs from "fs";
import path from "path";
import { rel, walk, UI, SRC } from "../lib/audit-core.mjs";
import { readComponentsCss } from "./componentsCss.mjs";

export function runMobileAudit() {
  const errors = [];
  const warnings = [];
  const advisories = [];

  for (const file of walk(UI, [], /\.(jsx|css)$/)) {
    const r = rel(file);
    const code = fs.readFileSync(file, "utf8");

    if (/100vw/.test(code) && !/max-w|max-width|ct-page/.test(code)) {
      warnings.push({
        kind: "viewport",
        file: r,
        message: "100vw without max-width — horizontal overflow risk on mobile",
      });
    }

    if (/overflow-x-(auto|scroll)/.test(code) && !/min-w-0|ct-/.test(code)) {
      advisories.push({
        kind: "overflow",
        file: r,
        message: "overflow-x scroll region — ensure parent has min-w-0",
      });
    }

    if (/w-\[\d{3,}px\]/.test(code)) {
      warnings.push({
        kind: "fixed-width",
        file: r,
        message: "Fixed Tailwind width >200px — may break narrow viewports",
      });
    }

    if (/text-\[(1[0-9]|[0-9])px\]/.test(code)) {
      advisories.push({
        kind: "typography",
        file: r,
        message: "Arbitrary small font size — prefer ct-caption / Text primitives",
      });
    }

    if (/\bwidth:\s*\d{3,}px\b/.test(code) && !/@media/.test(code)) {
      warnings.push({
        kind: "css-fixed-width",
        file: r,
        message: "Fixed CSS width ≥300px without media query — use max-width or ct-* layout",
      });
    }

    if (/\bmin-height:\s*100vh\b/.test(code) && !/\b100dvh\b/.test(code)) {
      advisories.push({
        kind: "vh-resize",
        file: r,
        message: "100vh without 100dvh — content may clip when mobile browser chrome shows/hides",
      });
    }

    if (/\btransform:\s*scale\(/.test(code) && r.endsWith(".jsx")) {
      advisories.push({
        kind: "scale-transform",
        file: r,
        message: "CSS scale transform on JSX — prefer responsive layout over zoom hacks",
      });
    }
  }

  const pagesDir = path.join(SRC, "ui/features/pages");
  if (fs.existsSync(pagesDir)) {
    for (const page of fs.readdirSync(pagesDir).filter((f) => f.endsWith("Page.jsx"))) {
      const abs = path.join(pagesDir, page);
      const code = fs.readFileSync(abs, "utf8");
      const r = rel(abs);
      if (!code.includes("PageShell") && !code.includes("MoneyShellPage") && page !== "MoneyShellPage.jsx") {
        if (page !== "CommitmentsPage.jsx" && page !== "LendingPage.jsx" && page !== "SpendsPage.jsx") {
          advisories.push({
            kind: "page-layout",
            file: r,
            message: "Page may render without PageShell — verify nested shell or add wrapper",
          });
        }
      }
      if (!/className=.*ct-/.test(code) && !code.includes("PageShell")) {
        advisories.push({
          kind: "ct-layout",
          file: r,
          message: "Page lacks ct-* layout classes — verify responsive stacking on small screens",
        });
      }
    }
  }

  const componentsCssText = readComponentsCss(path.join(UI, "styles"));
  if (componentsCssText) {
    const css = componentsCssText;
    if (!css.includes("@media") && !css.includes("min(")) {
      warnings.push({
        kind: "responsive-css",
        file: "src/ui/styles/components-*.css",
        message: "components.css has no @media queries — verify mobile resize rules exist",
      });
    }
    if (!css.includes("--ct-page-inset")) {
      warnings.push({
        kind: "page-inset",
        file: "src/ui/styles/components-*.css",
        message: "Missing --ct-page-inset tokens for device edge padding",
      });
    }
  }

  return {
    id: "mobile",
    title: "Mobile, responsive & device resize",
    errors,
    warnings,
    advisories,
  };
}
