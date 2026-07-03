import fs from "fs";
import path from "path";

const ACTIVE_PARTS = [
  "components-dh.css",
  "components-controls.css",
  "components-shell.css",
  "components-editorial-home.css",
  "components-editorial-pages.css",
  "components-charts.css",
  "components-editorial.css",
];

/** Archived ct-* bundles — reference only, not imported by index.css */
const ARCHIVE_PARTS = [
  "components-core.css",
  "components-surfaces.css",
  "net-worth.css",
  "theme-light.css",
];

function readPart(stylesDir, name) {
  const active = path.join(stylesDir, name);
  if (fs.existsSync(active)) return fs.readFileSync(active, "utf8");
  const archived = path.join(stylesDir, "_archive", name);
  if (fs.existsSync(archived)) return fs.readFileSync(archived, "utf8");
  return "";
}

/** @param {string} stylesDir absolute path to src/ui/styles */
export function readComponentsCss(stylesDir) {
  const legacy = path.join(stylesDir, "components.css");
  if (fs.existsSync(legacy)) {
    return fs.readFileSync(legacy, "utf8");
  }
  return [...ACTIVE_PARTS, ...ARCHIVE_PARTS]
    .map((name) => readPart(stylesDir, name))
    .filter(Boolean)
    .join("\n");
}

/** Active Direction H imports only (what index.css loads). */
export function readActiveStylesCss(stylesDir) {
  return ACTIVE_PARTS.map((name) => readPart(stylesDir, name)).filter(Boolean).join("\n");
}
