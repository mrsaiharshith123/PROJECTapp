import fs from "fs";
import path from "path";

const PARTS = [
  "components-core.css",
  "components-charts.css",
  "components-surfaces.css",
  "components-editorial.css",
];

/** @param {string} stylesDir absolute path to src/ui/styles */
export function readComponentsCss(stylesDir) {
  const legacy = path.join(stylesDir, "components.css");
  if (fs.existsSync(legacy)) {
    return fs.readFileSync(legacy, "utf8");
  }
  return PARTS.filter((name) => fs.existsSync(path.join(stylesDir, name)))
    .map((name) => fs.readFileSync(path.join(stylesDir, name), "utf8"))
    .join("\n");
}
