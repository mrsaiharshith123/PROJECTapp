/**
 * Mobile / responsive risk audit (static).
 */
import fs from "fs";
import { rel, walk, UI } from "../lib/audit-core.mjs";

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
  }

  return {
    id: "mobile",
    title: "Mobile & responsive governance",
    errors,
    warnings,
    advisories,
  };
}
